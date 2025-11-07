import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesDashboard } from './SalesDashboard';
import { UsersDashboard } from './UsersDashboard';
import { ProjectsDashboard } from './ProjectsDashboard';

export const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">💰 Vendas</TabsTrigger>
          <TabsTrigger value="users">👥 Usuários</TabsTrigger>
          <TabsTrigger value="projects">📊 Projetos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="mt-6">
          <SalesDashboard />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UsersDashboard />
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          <ProjectsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};