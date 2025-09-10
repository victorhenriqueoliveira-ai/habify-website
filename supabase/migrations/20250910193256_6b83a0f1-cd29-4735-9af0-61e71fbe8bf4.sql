-- Criar tabela de mensagens para comunicação dev-corretor
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view messages from their projects" 
ON public.project_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_messages.project_id 
    AND projects.user_id = auth.uid()
  )
  OR is_admin_or_dev()
);

CREATE POLICY "Users can send messages to their projects" 
ON public.project_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_messages.project_id 
    AND projects.user_id = auth.uid()
  )
  OR is_admin_or_dev()
);

CREATE POLICY "Users can mark their messages as read" 
ON public.project_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_messages.project_id 
    AND projects.user_id = auth.uid()
  )
  OR is_admin_or_dev()
);

-- Add realtime for projects and messages
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.project_messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_project_messages_updated_at
BEFORE UPDATE ON public.project_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create notification when message is sent
CREATE OR REPLACE FUNCTION public.notify_message_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_user_id UUID;
  sender_name TEXT;
BEGIN
  -- Get project owner and sender name
  SELECT p.user_id INTO project_user_id 
  FROM public.projects p 
  WHERE p.id = NEW.project_id;
  
  SELECT pr.name INTO sender_name 
  FROM public.profiles pr 
  WHERE pr.user_id = NEW.sender_id;

  -- Notify project owner if sender is not the owner
  IF project_user_id != NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      project_user_id,
      'Nova mensagem no projeto',
      sender_name || ' enviou uma mensagem sobre seu projeto.',
      'info'
    );
  ELSE
    -- Notify admins/devs if sender is the project owner
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT user_id, 'Nova mensagem de cliente', sender_name || ' enviou uma mensagem sobre o projeto.', 'info'
    FROM public.profiles 
    WHERE role IN ('admin', 'dev');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_message_sent_trigger
AFTER INSERT ON public.project_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_message_sent();