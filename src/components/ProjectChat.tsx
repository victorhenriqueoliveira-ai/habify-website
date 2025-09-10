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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Chat component for project communication

interface ProjectChatProps {
  projectId: string;
  projectTitle: string;
}

export const ProjectChat = ({ projectId, projectTitle }: ProjectChatProps) => {
  const { user, hasRole } = useAuth();
  const { messages, loading, sendMessage } = useProjectMessages(projectId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Chat do Projeto</CardTitle>
          <Badge variant="outline">{projectTitle}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
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
                      <div className={`flex max-w-[80%] space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {message.senderName?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`rounded-lg px-3 py-2 ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {!isOwn && (
                            <div className="text-xs font-medium mb-1">
                              {message.senderName}
                              {hasRole(['admin', 'dev']) && message.senderId && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {hasRole(['admin', 'dev']) ? 'Equipe' : 'Cliente'}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <p className="text-sm whitespace-pre-wrap">
                            {message.message}
                          </p>
                          
                          {message.attachmentUrl && (
                            <div className="mt-2">
                              <a 
                                href={message.attachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs underline"
                              >
                                📎 Anexo
                              </a>
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
              onChange={() => {
                // TODO: Implement file upload
                toast.info('Upload de arquivos em desenvolvimento');
              }}
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
            
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};