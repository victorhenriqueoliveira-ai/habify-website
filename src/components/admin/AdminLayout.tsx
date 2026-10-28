import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export const AdminLayout = () => {
  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-muted/40">
        <AdminTopbar />
        {/* O max-w evita linhas de tabela quilométricas em telas largas; o
         *  padding cresce por breakpoint pra não comer a tela no mobile. */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1360px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
