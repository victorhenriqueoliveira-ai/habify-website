import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Users, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectLimits } from '@/hooks/useProjectLimits';
import { LoadingState, PageHeader } from '@/components/admin/ui';

const ProjectTypeSelectionPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { canCreateProject, loading: plansLoading } = useProjectLimits();

  // For devs/admins, always allow project creation
  const isDevOrAdmin = hasRole(['admin', 'dev']);

  // Enquanto os planos carregam não dá pra saber se o usuário pode criar:
  // decidir agora manda pra compra quem já tem plano.
  if (!isDevOrAdmin && plansLoading) {
    return <LoadingState label="Verificando seus planos..." size="lg" fullScreen />;
  }

  // <Navigate> em vez de navigate(): chamar o navigate direto aqui é um
  // efeito colateral durante o render, que o React pode executar duas
  // vezes ou descartar no meio.
  if (!isDevOrAdmin && !canCreateProject) {
    return <Navigate to="/admin/new-project-purchase" replace />;
  }

  const handleEmpreendimentoChoice = () => {
    navigate('/admin/project-wizard', { state: { projectType: 'single_property' } });
  };

  const handleCorretorChoice = () => {
    navigate('/admin/project-wizard', { state: { projectType: 'realtor_multiple' } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        eyebrow="Projetos"
        title="Novo projeto"
        description="Escolha o tipo de site que você quer criar. Dá pra mudar o conteúdo depois, mas não o tipo."
      />

      {/* Project Type Cards */}
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <TypeCard
          icon={Building2}
          title="Site para empreendimento"
          description="Um imóvel só, com tudo sobre ele"
          hint="Ideal para construtoras e incorporadoras"
          features={[
            'Site completo do empreendimento',
            'Galeria de fotos e plantas',
            'Localização e mapas',
            'Design responsivo',
          ]}
          action={{ label: 'Criar site para empreendimento', onClick: handleEmpreendimentoChoice }}
        />

        <TypeCard
          icon={Users}
          title="Site para corretor"
          description="Até 5 imóveis, com seu perfil profissional"
          hint="Perfeito para corretores independentes"
          features={[
            'Até 5 empreendimentos',
            'Perfil profissional completo',
            'Portfólio de imóveis',
            'Contato direto com clientes',
            'Design responsivo',
          ]}
          action={{ label: 'Criar site para corretor', onClick: handleCorretorChoice }}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/my-projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Voltar para meus projetos
        </Button>
      </div>
    </div>
  );
};

interface TypeCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  /** Para quem é — uma linha abaixo do título. */
  hint: string;
  features: string[];
  action: { label: string; onClick: () => void };
}

function TypeCard({ icon: Icon, title, description, hint, features, action }: TypeCardProps) {
  return (
    <article className="admin-card-elevated flex flex-col p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <h2 className="mt-3.5 font-display text-[18px] font-bold tracking-[-0.025em]">{title}</h2>
      <p className="mt-0.5 text-[13.5px] text-foreground">{description}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
        {hint}
      </p>

      <ul className="mt-4 flex-1 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-[13px]">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button onClick={action.onClick} className="mt-5 w-full">
        {action.label}
      </Button>
    </article>
  );
}

export default ProjectTypeSelectionPage;
