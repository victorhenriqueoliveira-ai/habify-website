import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesDashboard } from './SalesDashboard';
import { UsersDashboard } from './UsersDashboard';
import { ProjectsDashboard } from './ProjectsDashboard';

/**
 * Relatórios — as três telas de analytics sob um seletor.
 *
 * Não leva PageHeader próprio: cada dashboard já traz o seu, e dois
 * títulos empilhados na mesma tela só empurram o conteúdo pra baixo.
 */
export const ReportsPage = () => {
  return (
    <Tabs defaultValue="sales" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="sales">Vendas</TabsTrigger>
        <TabsTrigger value="users">Usuários</TabsTrigger>
        <TabsTrigger value="projects">Projetos</TabsTrigger>
      </TabsList>

      <TabsContent value="sales" className="mt-5">
        <SalesDashboard />
      </TabsContent>

      <TabsContent value="users" className="mt-5">
        <UsersDashboard />
      </TabsContent>

      <TabsContent value="projects" className="mt-5">
        <ProjectsDashboard />
      </TabsContent>
    </Tabs>
  );
};
