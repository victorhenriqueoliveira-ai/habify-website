import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Building2, Users, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectLimits } from '@/hooks/useProjectLimits';

const ProjectTypeSelectionPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { canCreateProject } = useProjectLimits();
  
  // For devs/admins, always allow project creation
  const isDevOrAdmin = hasRole(['admin', 'dev']);
  
  // Redirect if regular user can't create projects
  if (!isDevOrAdmin && !canCreateProject) {
    navigate('/admin/new-project-purchase');
    return null;
  }

  const handleEmpreendimentoChoice = () => {
    // Navigate to empreendimento creation flow
    navigate('/admin/create-empreendimento');
  };

  const handleCorretorChoice = () => {
    // Navigate to corretor creation flow  
    navigate('/admin/create-corretor');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Projeto</h1>
          <p className="text-muted-foreground">
            Escolha o tipo de site que você deseja criar
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/admin/my-projects')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Meus Projetos
        </Button>
      </div>

      {/* Project Type Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Site para Empreendimento */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Site para Empreendimento</CardTitle>
                <CardDescription>
                  Ideal para construtoras e incorporadoras
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Site completo do empreendimento</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Galeria de fotos e plantas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Formulário de contato integrado</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Localização e mapas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Design responsivo</span>
              </div>
            </div>
            
            <Button 
              onClick={handleEmpreendimentoChoice}
              className="w-full mt-6"
              size="lg"
            >
              Criar Site para Empreendimento
            </Button>
          </CardContent>
        </Card>

        {/* Site para Corretor */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-xl">Site para Corretor</CardTitle>
                <CardDescription>
                  Perfeito para corretores independentes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Até 5 empreendimentos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Perfil profissional completo</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Portfólio de imóveis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Contato direto com clientes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Design responsivo</span>
              </div>
            </div>
            
            <Button 
              onClick={handleCorretorChoice}
              variant="secondary"
              className="w-full mt-6"
              size="lg"
            >
              Criar Site para Corretor
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="text-center pt-8">
        <p className="text-sm text-muted-foreground">
          Não sabe qual escolher? Entre em contato conosco para uma consultoria gratuita
        </p>
      </div>
    </div>
  );
};

export default ProjectTypeSelectionPage;