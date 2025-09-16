import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TransactionLinker } from "@/components/TransactionLinker";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import { LoginPage } from '@/pages/admin/LoginPage';
import { AuthPage } from '@/pages/admin/AuthPage';
import { AdminLayout } from "./components/admin/AdminLayout";

import { UsersPage } from "./pages/admin/UsersPage";
import { ProjectsPage } from "./pages/admin/ProjectsPage";
import { MyProjectsPage } from "./pages/admin/MyProjectsPage";
import NewProjectPurchasePage from "./pages/admin/NewProjectPurchasePage";
import NewProjectPage from "./pages/admin/NewProjectPage";
import { ProfilePage } from "./pages/admin/ProfilePage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { LogsPage } from "./pages/admin/LogsPage";
import { NewUserPage } from "./pages/admin/NewUserPage";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

// Role-based Route Component
const RoleBasedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { hasRole } = useAuth();
  
  if (!hasRole(allowedRoles)) {
    // Redirect regular users to my-projects, others to admin panel
    return <Navigate to="/admin/my-projects" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TransactionLinker />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            
            {/* Admin Routes */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              {/* Dashboard Routes */}
              <Route index element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <UsersPage />
                </RoleBasedRoute>
              } />
              <Route path="dashboard" element={
                <RoleBasedRoute allowedRoles={['user']}>
                  <Navigate to="/admin/my-projects" replace />
                </RoleBasedRoute>
              } />
              
              {/* Management Routes */}
              <Route path="users" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <UsersPage />
                </RoleBasedRoute>
              } />
              <Route path="projects" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <ProjectsPage />
                </RoleBasedRoute>
              } />
              <Route path="my-projects" element={
                <RoleBasedRoute allowedRoles={['user']}>
                  <MyProjectsPage />
                </RoleBasedRoute>
              } />
              <Route path="new-project" element={
                <RoleBasedRoute allowedRoles={['user']}>
                  <NewProjectPage />
                </RoleBasedRoute>
              } />
              <Route path="new-project-purchase" element={
                <RoleBasedRoute allowedRoles={['user']}>
                  <NewProjectPurchasePage />
                </RoleBasedRoute>
              } />
              <Route path="users/new" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <NewUserPage />
                </RoleBasedRoute>
              } />
              
              {/* Reports and Analytics */}
              <Route path="reports" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <ReportsPage />
                </RoleBasedRoute>
              } />
              
              {/* System Management */}
              <Route path="logs" element={
                <RoleBasedRoute allowedRoles={['dev']}>
                  <LogsPage />
                </RoleBasedRoute>
              } />
              <Route path="settings" element={
                <RoleBasedRoute allowedRoles={['dev']}>
                  <SettingsPage />
                </RoleBasedRoute>
              } />
              
              {/* Profile */}
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
