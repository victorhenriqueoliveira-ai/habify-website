import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, MapPin, Home, Bed, Bath, Square, Calendar, User, MessageSquare } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/admin';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { ProjectChat } from './ProjectChat';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectDetailsModalProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'default',
  approved: 'default',
  rejected: 'destructive',
} as const;

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const propertyTypeLabels = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  commercial: 'Comercial',
};

export const ProjectDetailsModal = ({ project, open, onClose }: ProjectDetailsModalProps) => {
  const { hasRole } = useAuth();
  const { updateProject } = useProjects();
  const { users } = useUsers();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!project) return null;

  const projectOwner = users.find(u => u.userId === project.userId);

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    setUpdatingStatus(true);
    try {
      const result = await updateProject(project.id, { status: newStatus });
      
      if (result.success) {
        toast.success(`Status alterado para: ${statusLabels[newStatus]}`);
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      toast.error('Erro interno');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{project.title}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={statusColors[project.status]}>
                {statusLabels[project.status]}
              </Badge>
              {hasRole(['admin', 'dev']) && (
                <Select
                  value={project.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Info */}
              {hasRole(['admin', 'dev']) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{projectOwner?.name || 'Nome não disponível'}</p>
                      <p className="text-sm text-muted-foreground">{projectOwner?.email || 'Email não disponível'}</p>
                      <p className="text-sm text-muted-foreground">{projectOwner?.phone || 'Telefone não informado'}</p>
                      {projectOwner?.company && (
                        <p className="text-sm text-muted-foreground">{projectOwner.company}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    Propriedade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                      {project.location}
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                      {propertyTypeLabels[project.propertyType]}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {project.bedrooms && (
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <Bed className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span className="font-medium">{project.bedrooms}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Quartos</p>
                        </div>
                      )}
                      
                      {project.bathrooms && (
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <Bath className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span className="font-medium">{project.bathrooms}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Banheiros</p>
                        </div>
                      )}
                      
                      {project.area && (
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <Square className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span className="font-medium">{project.area}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">m²</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Info */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Informações do Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Descrição</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {project.description || 'Sem descrição'}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {project.price > 0 && (
                        <div>
                          <h4 className="font-medium mb-1">Valor</h4>
                          <p className="text-lg font-bold text-green-600">
                            R$ {project.price.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium mb-1">Criado em</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {format(new Date(project.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                      </div>

                      {project.landingPageUrl && (
                        <div>
                          <h4 className="font-medium mb-1">Landing Page</h4>
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={project.landingPageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                            >
                              Ver Site
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="flex-1 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>Fotos do Projeto ({project.photos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {project.photos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma foto enviada ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {project.photos.map((photo, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-lg border">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1} do projeto`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 overflow-hidden">
            <div className="h-full">
              <ProjectChat projectId={project.id} projectTitle={project.title} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};