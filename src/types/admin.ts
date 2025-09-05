export type UserRole = 'user' | 'admin' | 'dev';

export type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  company?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  landingPageUrl?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  price: number;
  location: string;
  propertyType: 'house' | 'apartment' | 'land' | 'commercial';
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  projectType?: 'single_property' | 'realtor_multiple';
  transactionId?: string;
  features?: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface AuthUser extends User {
  token: string;
}

export interface DashboardStats {
  totalProjects: number;
  pendingProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
}