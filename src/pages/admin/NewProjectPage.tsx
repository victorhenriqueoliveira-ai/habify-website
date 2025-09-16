import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Building, User } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { useMultipleProjects } from '@/hooks/useMultipleProjects';
import { ProjectForm } from '@/components/ProjectForm';
import { useProjectLimits } from '@/hooks/useProjectLimits';

type ProjectType = 'single_property' | 'realtor_multiple';

const NewProjectPage = () => {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const { user, hasRole } = useAuth();
  const { users } = useUsers();
  const { canCreateProject } = useProjectLimits();
  const [loading, setLoading] = useState(false);
  const { projects, addProject, removeProject, updateProject, resetProjects } = useMultipleProjects();
  
  const [projectType, setProjectType] = useState<ProjectType>('single_property');
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.userId || user?.id || '');

  // For devs/admins, always allow project creation
  const isDevOrAdmin = hasRole(['admin', 'dev']);
  
  // Redirect if regular user can't create projects
  if (!isDevOrAdmin && !canCreateProject) {
    navigate('/admin/new-project-purchase');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For devs/admins, use selected user; for regular users, use their own ID
    const targetUserId = isDevOrAdmin ? selectedUserId : (user?.userId || user?.id);
    
    if (!targetUserId) {
      toast.error('Você precisa selecionar um cliente para criar o projeto');
      return;
    }

    // Validate projects
    const validProjects = projects.filter(project => project.title.trim());
    
    if (validProjects.length === 0) {
      toast.error('Pelo menos um projeto deve ter um título');
      return;
    }

    setLoading(true);
    
    try {
      const promises = validProjects.map(async (projectData) => {
        return await createProject({
          userId: targetUserId,
          title: projectData.title.trim(),
          description: projectData.description.trim(),
          projectType: projectType,
          price: projectData.price ? Number(projectData.price) : undefined,
          location: projectData.location.trim(),
          propertyType: projectData.propertyType,
          bedrooms: projectData.bedrooms ? Number(projectData.bedrooms) : undefined,
          bathrooms: projectData.bathrooms ? Number(projectData.bathrooms) : undefined,
          area: projectData.area ? Number(projectData.area) : undefined,
          photos: projectData.photos,
        });
      });

      const results = await Promise.all(promises);
      
      const successCount = results.filter(result => result.success).length;
      
      if (successCount === validProjects.length) {
        const selectedUser = users.find(u => u.userId === targetUserId);
        toast.success(`${successCount} projeto(s) criado(s) para ${selectedUser?.name || 'cliente'} com sucesso!`);
        navigate('/admin/projects');
      } else {
        toast.error(`Apenas ${successCount} de ${validProjects.length} projetos foram criados`);
      }
    } catch (error) {
      toast.error('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/my-projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Novo Projeto</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection for Dev/Admin */}
            {isDevOrAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente do projeto</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(user => user.role === 'user')
                          .map((client) => (
                            <SelectItem key={client.userId} value={client.userId}>
                              {client.name} ({client.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Projeto</CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-colors ${
                    projectType === 'single_property' 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setProjectType('single_property')}
                >
                  <CardContent className="flex flex-col items-center text-center p-6">
                    <Building className="h-8 w-8 mb-2" />
                    <h3 className="font-semibold">Empreendimento Único</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Site para um empreendimento específico
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-colors ${
                    projectType === 'realtor_multiple' 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setProjectType('realtor_multiple')}
                >
                  <CardContent className="flex flex-col items-center text-center p-6">
                    <User className="h-8 w-8 mb-2" />
                    <h3 className="font-semibold">Corretor/Múltiplos</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Site para corretor com até 5 empreendimentos
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            </Card>

            {/* Projects List */}
            <div className="space-y-6">
              {projects.map((project, index) => (
                <ProjectForm
                  key={index}
                  project={project}
                  index={index}
                  onUpdate={(field, value) => updateProject(index, field, value)}
                  onRemove={() => removeProject(index)}
                  showRemove={projects.length > 1}
                  isLastProject={index === projects.length - 1}
                />
              ))}

              {/* Add Project Button for Realtor Multiple */}
              {projectType === 'realtor_multiple' && projects.length < 5 && (
                <Card className="border-dashed border-2">
                  <CardContent className="flex items-center justify-center p-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={addProject}
                      className="text-muted-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Empreendimento ({projects.length}/5)
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isDevOrAdmin ? '/admin/projects' : '/admin/my-projects')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || (isDevOrAdmin && !selectedUserId)}
              >
                {loading ? 'Criando...' : `Criar ${projects.length > 1 ? 'Projetos' : 'Projeto'}`}
              </Button>
            </div>
          </form>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tipo:</Label>
                <Badge variant="outline" className="ml-2">
                  {projectType === 'single_property' 
                    ? 'Empreendimento Único' 
                    : 'Corretor/Múltiplos'}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium">Projetos:</Label>
                <p className="text-sm">{projects.length} adicionado(s)</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Total de Fotos:</Label>
                <p className="text-sm">
                  {projects.reduce((total, project) => total + project.photos.length, 0)} foto(s)
                </p>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground">
                <p>• O(s) projeto(s) será(ão) criado(s) com status "Pendente"</p>
                <p>• Nossa equipe será notificada automaticamente</p>
                <p>• Você pode editar as informações posteriormente</p>
                {projectType === 'realtor_multiple' && (
                  <p>• Máximo de 5 empreendimentos por projeto</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;