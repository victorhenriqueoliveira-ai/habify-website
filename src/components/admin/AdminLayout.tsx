import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export const AdminLayout = () => {
  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};
