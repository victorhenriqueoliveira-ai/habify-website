import {
  Users,
  Building2,
  User,
  Settings,
  FileText,
  BarChart3,
  LineChart,
  Landmark,
  CreditCard,
  Package,
  Wrench,
  ClipboardList,
  Bell,
  Route,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Fonte única de verdade da navegação do admin — sidebar e breadcrumb do
 * topbar leem daqui, em vez de cada um manter sua própria lista/dicionário
 * (que podiam divergir entre si).
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { title: 'Meus Projetos', url: '/admin/my-projects', icon: Building2, roles: ['user'] },
      { title: 'Assinaturas', url: '/admin/subscriptions', icon: Package, roles: ['user'] },
      { title: 'Manutenções', url: '/admin/my-maintenances', icon: Wrench, roles: ['user', 'corretor'] },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Usuários', url: '/admin/users', icon: Users, roles: ['admin', 'dev'] },
      { title: 'Projetos', url: '/admin/projects', icon: Building2, roles: ['admin', 'dev'] },
      { title: 'Pagamentos', url: '/admin/payments', icon: CreditCard, roles: ['admin', 'dev'] },
      { title: 'Manutenções (Admin)', url: '/admin/maintenances', icon: Wrench, roles: ['admin', 'dev'] },
      { title: 'Solicitações', url: '/admin/maintenance-requests', icon: ClipboardList, roles: ['admin', 'dev'] },
    ],
  },
  {
    label: 'Análise',
    items: [
      { title: 'Pipeline de Geração', url: '/admin/pipeline-logs', icon: Route, roles: ['admin', 'dev'] },
      { title: 'Dashboard Manutenções', url: '/admin/maintenances-dashboard', icon: BarChart3, roles: ['admin', 'dev'] },
      { title: 'Relatórios', url: '/admin/reports', icon: LineChart, roles: ['admin', 'dev'] },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Logs', url: '/admin/logs', icon: FileText, roles: ['dev'] },
      { title: 'Configurações', url: '/admin/settings', icon: Settings, roles: ['dev'] },
      { title: 'Gateway de Pagamento', url: '/admin/payment-settings', icon: Landmark, roles: ['dev'] },
    ],
  },
];

/** Itens fixos no rodapé da sidebar, visíveis pra qualquer papel logado. */
export const bottomItems: NavItem[] = [
  { title: 'Notificações', url: '/admin/notifications', icon: Bell, roles: ['user', 'admin', 'dev', 'corretor'] },
  { title: 'Meu Perfil', url: '/admin/profile', icon: User, roles: ['user', 'admin', 'dev', 'corretor'] },
];

/** Rótulo de breadcrumb pra uma rota — busca em todos os grupos + rodapé. */
export function findNavLabel(path: string): string | undefined {
  for (const group of navGroups) {
    const match = group.items.find((item) => item.url === path);
    if (match) return match.title;
  }
  return bottomItems.find((item) => item.url === path)?.title;
}
