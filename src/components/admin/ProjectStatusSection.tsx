import { LucideIcon, Eye, MessageSquare, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiveSiteStatusBadge } from '@/components/admin/LiveSiteStatusBadge';
import { Project } from '@/types/admin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type SectionTone = 'warning' | 'info' | 'review' | 'success';

const toneClasses: Record<SectionTone, { border: string; icon: string; badge: string }> = {
  warning: {
    border: 'border-warning/30',
    icon: 'text-warning',
    badge: 'bg-warning/10 text-warning',
  },
  info: {
    border: 'border-info/30',
    icon: 'text-info',
    badge: 'bg-info/10 text-info',
  },
  review: {
    border: 'border-primary/30',
    icon: 'text-primary',
    badge: 'bg-primary/10 text-primary',
  },
  success: {
    border: 'border-success/30',
    icon: 'text-success',
    badge: 'bg-success/10 text-success',
  },
};

interface ProjectStatusSectionProps {
  icon: LucideIcon;
  tone: SectionTone;
  title: string;
  description: string;
  projects: Project[];
  showClientName: boolean;
  getUserName: (userId: string) => string;
  dateLabel?: (project: Project) => string;
  onViewDetails: (projectId: string) => void;
  onOpenChat: (projectId: string) => void;
}

export const ProjectStatusSection = ({
  icon: Icon,
  tone,
  title,
  description,
  projects,
  showClientName,
  getUserName,
  dateLabel,
  onViewDetails,
  onOpenChat,
}: ProjectStatusSectionProps) => {
  if (projects.length === 0) return null;

  const classes = toneClasses[tone];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', classes.icon)} />
          {title} ({projects.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className={classes.border}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{project.title}</h3>
                    <LiveSiteStatusBadge projectId={project.id} />
                  </div>
                  {showClientName && (
                    <p className="text-sm text-muted-foreground">
                      Cliente: {getUserName(project.userId)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{project.location || 'Local não definido'}</p>
                  <div className="text-sm">
                    {project.price > 0 && (
                      <p className="font-medium">R$ {project.price.toLocaleString('pt-BR')}</p>
                    )}
                    <p className="text-muted-foreground">
                      {dateLabel
                        ? dateLabel(project)
                        : format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(project.id)}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenChat(project.id)}
                      className="flex-1"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                    {project.landingPageUrl && (
                      <Button
                        size="sm"
                        onClick={() => window.open(project.landingPageUrl, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver Site
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
