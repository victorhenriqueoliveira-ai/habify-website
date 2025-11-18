import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip } from 'lucide-react';
import { useProjectMessages } from '@/hooks/useProjectMessages';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { uploadFileToStorage } from '@/utils/uploadToStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Chat component for project communication

interface ProjectChatProps {
  projectId: string;
  projectTitle: string;
}

export const ProjectChat = ({ projectId, projectTitle }: ProjectChatProps) => {
  const { user, hasRole } = useAuth();
  const { messages, loading, sendMessage, fetchMessages } = useProjectMessages(projectId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const result = await sendMessage(newMessage);
      
      if (result.success) {
        setNewMessage('');
        toast.success('Mensagem enviada!');
        try { await fetchMessages(); } catch (err) { /* ignore */ }
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro interno');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prevent multiple uploads
    setSending(true);

    // Size limit: 8MB
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Arquivo muito grande. Limite: 8MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSending(false);
      return;
    }

    try {
      // Upload to storage under a chat-specific folder in chat-attachments bucket
      const uploadPath = `chat/${projectId}`;

      // Start a simulated progress bar while uploading (since supabase client doesn't provide native progress)
      setUploadProgress(5);
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(95, p + Math.floor(Math.random() * 10)));
      }, 300);

      const publicUrl = await uploadFileToStorage(file, 'chat-attachments', uploadPath);
      clearInterval(progressInterval);
      setUploadProgress(100);
      // keep progress visible briefly
      setTimeout(() => setUploadProgress(0), 800);

      if (!publicUrl) {
        toast.error('Erro ao fazer upload do arquivo');
        return;
      }

      // Send message with attachmentUrl. If user typed a message, include it; otherwise send a placeholder
      const messageText = newMessage.trim() || '📷 Enviado um anexo';
      const res = await sendMessage(messageText, publicUrl);

      if (res.success) {
        setNewMessage('');
        toast.success('Arquivo enviado no chat');
        try { await fetchMessages(); } catch (err) { /* ignore */ }
      } else {
        console.error('sendMessage error:', res.error);
        toast.error('Erro ao enviar mensagem com anexo');
      }
    } catch (error) {
      console.error('Error uploading file for chat:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSending(false);
    }
  };

  const openLightbox = (url: string) => {
    setLightboxUrl(url);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setLightboxUrl(null);
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === user?.userId || senderId === user?.id;
  };

  const getMessageTime = (createdAt: string) => {
    return format(new Date(createdAt), 'HH:mm', { locale: ptBR });
  };

  const getMessageDate = (createdAt: string) => {
    return format(new Date(createdAt), 'dd/MM/yyyy', { locale: ptBR });
  };

  const shouldShowDate = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  return (
    <Card className="flex flex-col h-[60vh] md:h-[800px] min-h-[420px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Chat do Projeto</CardTitle>
          <Badge variant="outline">{projectTitle}</Badge>
        </div>
      </CardHeader>
      
  <CardContent className="flex flex-col flex-1 p-0 min-h-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 min-h-0 overflow-y-auto">
          <div className="space-y-4 pb-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma mensagem ainda.</p>
                <p className="text-sm">Inicie uma conversa sobre este projeto!</p>
              </div>
              ) : (
              messages.map((message, index) => {
                const previousMessage = messages[index - 1];
                const showDate = shouldShowDate(message, previousMessage);
                const isOwn = isCurrentUser(message.senderId);
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        {getMessageDate(message.createdAt)}
                      </div>
                    )}
                    
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[70%] sm:max-w-[60%] md:max-w-[50%] lg:max-w-[45%] space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {message.senderName?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`rounded-lg px-3 py-2 break-words ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {!isOwn && (
                            <div className="text-xs font-medium mb-1">
                              {message.senderName}
                              {hasRole(['admin', 'dev']) && message.senderId && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {hasRole(['admin', 'dev']) ? 'Usuário' : 'Equipe'}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                          
                          {message.attachmentUrl && (
                            <div className="mt-2">
                              {/\.(jpe?g|png|gif|webp|svg)$/i.test(message.attachmentUrl) ? (
                                // open image in lightbox instead of navigating away
                                <button
                                  type="button"
                                  onClick={() => openLightbox(message.attachmentUrl as string)}
                                  className="inline-block"
                                >
                                  <img src={message.attachmentUrl} alt="anexo" className="w-full sm:w-64 md:w-80 lg:w-96 rounded-md cursor-zoom-in object-cover" />
                                </button>
                              ) : (
                                <a 
                                  href={message.attachmentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs underline"
                                >
                                  📎 Anexo
                                </a>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs opacity-70 mt-1">
                            {getMessageTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="flex-1"
            />
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelected}
            />
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleFileUpload}
              disabled={sending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            {/* Upload progress bar */}
            {uploadProgress > 0 && (
              <div className="flex items-center w-48">
                <Progress value={uploadProgress} className="w-full mr-2" />
                <div className="text-xs w-10 text-right">{uploadProgress}%</div>
              </div>
            )}
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
      {/* Lightbox Dialog for image preview */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader>
            <DialogTitle>Visualizador</DialogTitle>
          </DialogHeader>
          <div className="p-4 flex justify-center">
            {lightboxUrl ? (
              // responsive image
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightboxUrl} alt="visualização" className="max-h-[80vh] max-w-full object-contain" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};