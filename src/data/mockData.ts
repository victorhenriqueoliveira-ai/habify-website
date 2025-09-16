import { User, Project, Notification, DashboardStats } from '@/types/admin';

export const mockUsers: User[] = [
  {
    id: '1',
    userId: 'auth-user-1',
    name: 'Carlos Mendes',
    email: 'carlos@email.com',
    phone: '(11) 99999-9999',
    role: 'user',
    company: 'Imóveis Premium',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-15',
    lastLogin: '2024-08-28',
    isActive: true,
  },
  {
    id: '2',
    userId: 'auth-user-2',
    name: 'Marina Santos',
    email: 'marina@habify.com',
    phone: '(11) 88888-8888',
    role: 'admin',
    company: 'HabiFy',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-01',
    lastLogin: '2024-08-28',
    isActive: true,
  },
  {
    id: '3',
    userId: 'auth-user-3',
    name: 'Roberto Silva',
    email: 'roberto@email.com',
    phone: '(11) 77777-7777',
    role: 'user',
    company: 'Silva Imóveis',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-02-10',
    lastLogin: '2024-08-27',
    isActive: true,
  },
  {
    id: '4',
    userId: 'auth-user-4',
    name: 'Ana Paula',
    email: 'ana@email.com',
    phone: '(11) 66666-6666',
    role: 'user',
    company: 'Corretora Ana Paula',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-03-05',
    lastLogin: '2024-08-26',
    isActive: false,
  },
  {
    id: '5',
    userId: 'auth-user-5',
    name: 'João Dev',
    email: 'joao@habify.com',
    phone: '(11) 55555-5555',
    role: 'dev',
    company: 'HabiFy Tech',
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-01',
    lastLogin: '2024-08-28',
    isActive: true,
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    userId: '1',
    title: 'Casa Moderna no Brooklin',
    description: 'Linda casa de 3 quartos com piscina e churrasqueira',
    status: 'completed',
    landingPageUrl: 'https://habify.com/casa-brooklin-1',
    photos: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400',
    ],
    createdAt: '2024-08-20',
    updatedAt: '2024-08-25',
    completedAt: '2024-08-25',
    price: 850000,
    location: 'Brooklin, São Paulo - SP',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
  },
  {
    id: '2',
    userId: '1',
    title: 'Apartamento Vila Madalena',
    description: 'Apartamento moderno de 2 quartos com sacada',
    status: 'in_progress',
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
    ],
    createdAt: '2024-08-26',
    updatedAt: '2024-08-28',
    price: 450000,
    location: 'Vila Madalena, São Paulo - SP',
    propertyType: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
  },
  {
    id: '3',
    userId: '3',
    title: 'Cobertura Jardins',
    description: 'Cobertura de luxo com vista panorâmica',
    status: 'pending',
    photos: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
    ],
    createdAt: '2024-08-28',
    updatedAt: '2024-08-28',
    price: 1200000,
    location: 'Jardins, São Paulo - SP',
    propertyType: 'apartment',
    bedrooms: 4,
    bathrooms: 3,
    area: 220,
  },
  {
    id: '4',
    userId: '4',
    title: 'Casa de Campo Ibiúna',
    description: 'Casa de campo para final de semana com lago',
    status: 'rejected',
    photos: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    ],
    createdAt: '2024-08-15',
    updatedAt: '2024-08-18',
    price: 320000,
    location: 'Ibiúna - SP',
    propertyType: 'house',
    bedrooms: 2,
    bathrooms: 1,
    area: 120,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'Site Publicado!',
    message: 'Seu site "Casa Moderna no Brooklin" foi publicado com sucesso',
    type: 'success',
    read: false,
    createdAt: '2024-08-28T10:30:00Z',
  },
  {
    id: '2',
    userId: '1',
    title: 'Projeto em Análise',
    message: 'Seu projeto "Apartamento Vila Madalena" está sendo analisado pela nossa equipe',
    type: 'info',
    read: false,
    createdAt: '2024-08-28T09:15:00Z',
  },
  {
    id: '3',
    userId: '3',
    title: 'Documentos Pendentes',
    message: 'Faltam documentos para o projeto "Cobertura Jardins"',
    type: 'warning',
    read: true,
    createdAt: '2024-08-27T14:20:00Z',
  },
];

export const mockDashboardStats: DashboardStats = {
  totalProjects: 156,
  pendingProjects: 23,
  inProgressProjects: 45,
  completedProjects: 88,
  totalUsers: 342,
  activeUsers: 278,
  monthlyRevenue: 125000,
  monthlyGrowth: 18.5,
};

// Mock login function
export const mockLogin = (email: string, password: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email && u.isActive);
      if (user && password === '123456') {
        resolve(user);
      } else {
        resolve(null);
      }
    }, 1000);
  });
};