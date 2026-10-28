import { LucideIcon, Eye, MapPin, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveSiteStatusBadge } from '@/components/admin/LiveSiteStatusBadge';
import { SectionHeader } from '@/components/admin/ui';
import { Project } from '@/types/admin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type SectionTone = 'warning' | 'info' | 'review' | 'success';

/** Faixa de cor no topo do card — o único lugar onde o tom aparece. */
const stripeClass: Record<SectionTone, string> = {
  warning: 'bg-warning',
  info: 'bg-info',
  review: 'bg-primary',
  success: 'bg-success',
};

const countTone = {
  warning: 'warning',
  info: 'info',
  review: 'primary',
  success: 'success',
} as const;

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

  return (
    <section className="space-y-3.5">
      <SectionHeader
        icon={Icon}
        title={title}
        description={description}
        count={projects.length}
        tone={countTone[tone]}
      />

      {/* Antes isto era Card dentro de Card: duas bordas e duas sombras
       *  somadas em cada projeto. Agora a seção é um bloco solto e só o
       *  projeto é um card. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <article
            key={project.id}
            className="admin-card-elevated relative flex flex-col overflow-hidden p-4 pt-[18px]"
          >
            <span
              aria-hidden="true"
              className={cn('absolute inset-x-0 top-0 h-[3px]', stripeClass[tone])}
            />

            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-[14.5px] font-semibold leading-snug text-foreground">
                {project.title}
              </h3>
              <LiveSiteStatusBadge projectId={project.id} />
            </div>

            {showClientName && (
              <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                {getUserName(project.userId)}
              </p>
            )}

            <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{project.location || 'Local não definido'}</span>
            </p>

            <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-border pt-3">
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {dateLabel
                  ? dateLabel(project)
                  : format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
              {project.price > 0 && (
                <span className="font-display text-[15px] font-bold tabular-nums tracking-[-0.02em]">
                  R$ {project.price.toLocaleString('pt-BR')}
                </span>
              )}
            </div>

            {/* mt-auto: com alturas de texto diferentes, os botões continuam
             *  alinhados na mesma linha de um card pro outro. */}
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              {project.landingPageUrl ? (
                <Button
                  size="sm"
                  onClick={() => window.open(project.landingPageUrl, '_blank', 'noopener,noreferrer')}
                  className="flex-1"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Ver site
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onViewDetails(project.id)} className="flex-1">
                  <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Detalhes
                </Button>
              )}

              {project.landingPageUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(project.id)}
                  aria-label={`Ver detalhes de ${project.title}`}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenChat(project.id)}
                aria-label={`Abrir chat de ${project.title}`}
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
