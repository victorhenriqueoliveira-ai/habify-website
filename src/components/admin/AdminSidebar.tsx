import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  Building2,
  User,
  Settings,
  FileText,
  BarChart3,
  Shield,
  CreditCard,
  Package,
  Wrench
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Logo from '../../../public/logotipo_habify.png';

const menuItems = [
  {
    title: 'Meus Projetos',
    url: '/admin/my-projects',
    icon: Building2,
    roles: ['user'],
  },
  {
    title: 'Assinaturas',
    url: '/admin/subscriptions',
    icon: Package,
    roles: ['user'],
  },
  {
    title: 'Manutenções',
    url: '/admin/my-maintenances',
    icon: Wrench,
    roles: ['user', 'corretor'],
  },
  {
    title: 'Usuários',
    url: '/admin',
    icon: Users,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Criar Admin/Dev',
    url: '/admin/users/create-admin',
    icon: Shield,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Projetos',
    url: '/admin/projects',
    icon: Building2,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Pagamentos',
    url: '/admin/payments',
    icon: CreditCard,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Manutenções Admin',
    url: '/admin/maintenances',
    icon: Wrench,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Dashboard Manutenções',
    url: '/admin/maintenances-dashboard',
    icon: BarChart3,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Relatórios',
    url: '/admin/reports',
    icon: BarChart3,
    roles: ['admin', 'dev'],
  },
  {
    title: 'Logs',
    url: '/admin/logs',
    icon: FileText,
    roles: ['dev'],
  },
  {
    title: 'Configurações',
    url: '/admin/settings',
    icon: Settings,
    roles: ['dev'],
  },
  {
    title: 'Gateway de Pagamento',
    url: '/admin/payment-settings',
    icon: CreditCard,
    roles: ['dev'],
  },
  {
    title: 'Meu Perfil',
    url: '/admin/profile',
    icon: User,
    roles: ['user', 'admin', 'dev'],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const { user, hasRole } = useAuth();

  const filteredItems = menuItems.filter(item => hasRole(item.roles));
  
  const isExpanded = isHovered || isOpen;
  
  const sidebarVariants = {
    collapsed: { width: '64px' },
    expanded: { width: '240px' }
  };

  const handleNavClick = () => {
    if (isOpen) {
      onClose();
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className={cn(
          "hidden lg:flex flex-col bg-background border-r border-border shadow-sm transition-all duration-300 ease-in-out",
          "fixed left-0 top-0 bottom-0 z-30"
        )}
        initial="collapsed"
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={sidebarVariants}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-border px-4">
          <motion.div 
            className="flex items-center gap-3 overflow-hidden"
            animate={{ opacity: isExpanded ? 1 : 0 }}
          >
            <img src={Logo} alt="HabiFy" className="w-8 h-8 flex-shrink-0 object-contain" />
            {isExpanded && (
              <motion.h1 
                className="font-bold text-lg whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                HabiFy
              </motion.h1>
            )}
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.url || 
                (item.url === '/admin' && location.pathname === '/admin/');
              
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-accent/50",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <motion.span 
                      className="text-sm whitespace-nowrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 }}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        {user && isExpanded && (
          <motion.div 
            className="p-4 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize truncate">{user.role}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.aside>

      {/* Mobile Sidebar */}
      <motion.aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 z-50 bg-background shadow-2xl w-64"
        )}
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <img src={Logo} alt="HabiFy" className="w-8 h-8 object-contain" />
          <h1 className="font-bold text-lg ml-3">HabiFy</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.url || 
                (item.url === '/admin' && location.pathname === '/admin/');
              
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-accent/50",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.title}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize truncate">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Spacer for desktop to push content */}
      <div className="hidden lg:block w-16 flex-shrink-0" />
    </>
  );
};