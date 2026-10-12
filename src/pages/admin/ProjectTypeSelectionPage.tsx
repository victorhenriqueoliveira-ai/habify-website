import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Users, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectLimits } from '@/hooks/useProjectLimits';
import { PageHeader } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

const ProjectTypeSelectionPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { canCreateProject, loading: plansLoading } = useProjectLimits();

  // For devs/admins, always allow project creation
  const isDevOrAdmin = hasRole(['admin', 'dev']);

  // Redirect if regular user can't create projects — só depois que os planos
  // terminarem de carregar, senão redireciona errado antes de saber se o
  // usuário tem plano disponível.
  if (!isDevOrAdmin && !plansLoading && !canCreateProject) {
    navigate('/admin/new-project-purchase');
    return null;
  }

  const handleEmpreendimentoChoice = () => {
    navigate('/admin/project-wizard', { state: { projectType: 'single_property' } });
  };

  const handleCorretorChoice = () => {
    navigate('/admin/project-wizard', { state: { projectType: 'realtor_multiple' } });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Sparkles} title="Novo Projeto" description="Escolha o tipo de site que você deseja criar" />

      {/* Project Type Cards */}
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <TypeCard
          icon={Building2}
          title="Site para Empreendimento"
          description="Ideal para construtoras e incorporadoras"
          features={[
            'Site completo do empreendimento',
            'Galeria de fotos e plantas',
            'Localização e mapas',
            'Design responsivo',
          ]}
          action={{ label: 'Criar Site para Empreendimento', onClick: handleEmpreendimentoChoice }}
        />

        <TypeCard
          icon={Users}
          title="Site para Corretor"
          description="Perfeito para corretores independentes"
          features={[
            'Até 5 empreendimentos',
            'Perfil profissional completo',
            'Portfólio de imóveis',
            'Contato direto com clientes',
            'Design responsivo',
          ]}
          action={{ label: 'Criar Site para Corretor', onClick: handleCorretorChoice }}
          variant="secondary"
        />
      </div>

      <div className="mt-4 flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/my-projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Meus Projetos
        </Button>
      </div>
    </div>
  );
};

interface TypeCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  action: { label: string; onClick: () => void };
  variant?: 'primary' | 'secondary';
}

function TypeCard({ icon: Icon, title, description, features, action, variant = 'primary' }: TypeCardProps) {
  return (
    <div className="admin-card-elevated flex flex-col p-6">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg',
            variant === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground',
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-2.5">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 shrink-0 text-success" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Button onClick={action.onClick} className="mt-6 w-full" size="lg" variant={variant === 'secondary' ? 'secondary' : 'default'}>
        {action.label}
      </Button>
    </div>
  );
}

export default ProjectTypeSelectionPage;
