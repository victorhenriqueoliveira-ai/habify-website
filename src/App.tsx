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
import { ForgotPasswordPage } from '@/pages/admin/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/admin/ResetPasswordPage';
import { AuthPage } from '@/pages/admin/AuthPage';
import { AdminLayout } from "./components/admin/AdminLayout";

import { UsersPage } from "./pages/admin/UsersPage";
import { ProjectsPage } from "./pages/admin/ProjectsPage";
import { PaymentsPage } from "./pages/admin/PaymentsPage";
import { MyProjectsPage } from "./pages/admin/MyProjectsPage";
import NewProjectPurchasePage from "./pages/admin/NewProjectPurchasePage";
import NewProjectPage from "./pages/admin/NewProjectPage";
import ProjectTypeSelectionPage from "./pages/admin/ProjectTypeSelectionPage";
import CreateEmpreendimentoPage from "./pages/admin/CreateEmpreendimentoPage";
import CreateCorretorPage from "./pages/admin/CreateCorretorPage";
import ProjectWizardPage from "./pages/admin/ProjectWizardPage";
import { ProfilePage } from "./pages/admin/ProfilePage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { LogsPage } from "./pages/admin/LogsPage";
import { NewUserPage } from "./pages/admin/NewUserPage";
import { SubscriptionsUserPage } from "./pages/admin/subscriptionsUser";
import { UserSubscriptionsPage } from "./pages/admin/UserSubscriptionsPage";
import { ProjectDetailPage } from "./pages/admin/ProjectDetailPage";
import { ProjectEditPage } from "./pages/admin/ProjectEditPage";
import { UserEditPage } from "./pages/admin/UserEditPage";

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
    return <Navigate to="/login" replace />;
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
            
            {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
              <Route path="payments" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <PaymentsPage />
                </RoleBasedRoute>
              } />
              <Route path="my-projects" element={
                <RoleBasedRoute allowedRoles={['user']}>
                  <MyProjectsPage />
                </RoleBasedRoute>
              } />
              {/* Subscriptions */}
              <Route path="subscriptions" element={
                <RoleBasedRoute allowedRoles={['user']}>
                  <SubscriptionsUserPage />
                </RoleBasedRoute>
              } />
              <Route path="users/:userId/subscriptions" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <UserSubscriptionsPage />
                </RoleBasedRoute>
              } />
              
              {/* Project Pages */}
              <Route path="projects/:id" element={
                <RoleBasedRoute allowedRoles={['user', 'admin', 'dev']}>
                  <ProjectDetailPage />
                </RoleBasedRoute>
              } />
              <Route path="projects/:id/edit" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <ProjectEditPage />
                </RoleBasedRoute>
              } />
              
              {/* User Pages */}
              <Route path="users/:id/edit" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <UserEditPage />
                </RoleBasedRoute>
              } />

              {/* New Project Creation Flow */}
              <Route path="new-project" element={
                <RoleBasedRoute allowedRoles={['user', 'admin', 'dev']}>
                  <ProjectTypeSelectionPage />
                </RoleBasedRoute>
              } />
              <Route path="create-empreendimento" element={
                <RoleBasedRoute allowedRoles={['user', 'admin', 'dev']}>
                  <CreateEmpreendimentoPage />
                </RoleBasedRoute>
              } />
              <Route path="create-corretor" element={
                <RoleBasedRoute allowedRoles={['user', 'admin', 'dev']}>
                  <CreateCorretorPage />
                </RoleBasedRoute>
              } />
              <Route path="project-wizard" element={
                <RoleBasedRoute allowedRoles={['user', 'admin', 'dev']}>
                  <ProjectWizardPage />
                </RoleBasedRoute>
              } />
              <Route path="manage-projects" element={
                <RoleBasedRoute allowedRoles={['user', 'admin', 'dev']}>
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
