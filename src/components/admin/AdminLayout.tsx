import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-background flex">
      {/* Sidebar (mobile + desktop) */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar fixo — desloca 64px em telas lg+ pra não ficar atrás da sidebar recolhida */}
        <div className="fixed top-0 left-0 lg:left-16 right-0 z-40">
          <AdminTopbar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        {/* Espaço para compensar a altura do Topbar */}
      <main className="flex-1 pt-20 p-8 overflow-y-auto bg-muted/30">
          <Outlet />
        </main>
      </div>

      {/* Overlay do mobile (para fechar a sidebar ao clicar fora) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
