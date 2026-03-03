import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TransactionLinker } from "@/components/TransactionLinker";
import { Suspense, lazy, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorTracking } from "@/hooks/useErrorTracking";
import { useRouteTracking } from "@/hooks/useAnalytics";

// ✅ FASE 3 - Item 12: Lazy Loading para páginas pesadas
const Index = lazy(() => import("./pages/Index"));
const TermosDeUso = lazy(() => import("./pages/termosUso"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));

// Auth pages
const LoginPage = lazy(() => import("@/pages/admin/LoginPage").then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/admin/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/pages/admin/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const AuthPage = lazy(() => import("@/pages/admin/AuthPage").then(m => ({ default: m.AuthPage })));

// Admin Layout
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));

// Admin pages
const UsersPage = lazy(() => import("./pages/admin/UsersPage").then(m => ({ default: m.UsersPage })));
const UsersDashboard = lazy(() => import("./pages/admin/UsersDashboard").then(m => ({ default: m.UsersDashboard })));
const ProjectsPage = lazy(() => import("./pages/admin/ProjectsPage").then(m => ({ default: m.ProjectsPage })));
const PaymentsPage = lazy(() => import("./pages/admin/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
const MyProjectsPage = lazy(() => import("./pages/admin/MyProjectsPage").then(m => ({ default: m.MyProjectsPage })));
const NewProjectPurchasePage = lazy(() => import("./pages/admin/NewProjectPurchasePage"));
const NewProjectPage = lazy(() => import("./pages/admin/NewProjectPage"));
const ProjectTypeSelectionPage = lazy(() => import("./pages/admin/ProjectTypeSelectionPage"));
const CreateEmpreendimentoPage = lazy(() => import("./pages/admin/CreateEmpreendimentoPage"));
const CreateCorretorPage = lazy(() => import("./pages/admin/CreateCorretorPage"));
const ProjectWizardPage = lazy(() => import("./pages/admin/ProjectWizardPage"));
const ProfilePage = lazy(() => import("./pages/admin/ProfilePage").then(m => ({ default: m.ProfilePage })));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage").then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage").then(m => ({ default: m.SettingsPage })));
const LogsPage = lazy(() => import("./pages/admin/LogsPage").then(m => ({ default: m.LogsPage })));
const NewUserPage = lazy(() => import("./pages/admin/NewUserPage").then(m => ({ default: m.NewUserPage })));
const SubscriptionsUserPage = lazy(() => import("./pages/admin/subscriptionsUser").then(m => ({ default: m.SubscriptionsUserPage })));
const UserSubscriptionsPage = lazy(() => import("./pages/admin/UserSubscriptionsPage").then(m => ({ default: m.UserSubscriptionsPage })));
const MaintenancesPage = lazy(() => import("./pages/admin/MaintenancesPage"));
const UserMaintenancesPage = lazy(() => import("./pages/admin/UserMaintenancesPage"));
const MaintenanceCheckoutPage = lazy(() => import("./pages/admin/MaintenanceCheckoutPage"));
const MaintenanceRequestsPage = lazy(() => import("./pages/admin/MaintenanceRequestsPage"));
const MaintenancesDashboard = lazy(() => import("./pages/admin/MaintenancesDashboard"));
const CreateAdminPage = lazy(() => import("./pages/admin/CreateAdminPage"));
const ProjectDetailPage = lazy(() => import("./pages/admin/ProjectDetailPage").then(m => ({ default: m.ProjectDetailPage })));
const ProjectEditPage = lazy(() => import("./pages/admin/ProjectEditPage").then(m => ({ default: m.ProjectEditPage })));
const UserEditPage = lazy(() => import("./pages/admin/UserEditPage").then(m => ({ default: m.UserEditPage })));
const AssignPlanPage = lazy(() => import("./pages/admin/AssignPlanPage"));
const PaymentDetailPage = lazy(() => import("./pages/admin/PaymentDetailPage"));
const PaymentLogsPage = lazy(() => import("./pages/admin/PaymentLogsPage").then(m => ({ default: m.PaymentLogsPage })));
const PaymentSettingsPage = lazy(() => import("./pages/admin/PaymentSettingsPage").then(m => ({ default: m.PaymentSettingsPage })));

const queryClient = new QueryClient();

// ✅ FASE 3 - Item 9: Skeleton Loader para carregamento
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 w-full max-w-md p-8">
      <Skeleton className="h-12 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-10 w-32 mx-auto mt-6" />
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
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
    return <Navigate to="/admin/my-projects" replace />;
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
};

// Route tracking wrapper
const RouteTracker = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const trackRoute = useRouteTracking();

  useEffect(() => {
    trackRoute(location);
  }, [location, trackRoute]);

  return <>{children}</>;
};

// App with monitoring
const AppContent = () => {
  useErrorTracking(); // Enable global error tracking
  
  return (
    <BrowserRouter>
      <RouteTracker>
        <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/checkout/:planId" element={<CheckoutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            
            {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
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
              <Route path="payments/:orderId" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <PaymentDetailPage />
                </RoleBasedRoute>
              } />
              <Route path="payment-logs" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <PaymentLogsPage />
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
              <Route path="maintenances" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <MaintenancesPage />
                </RoleBasedRoute>
              } />
              <Route path="maintenances-dashboard" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <MaintenancesDashboard />
                </RoleBasedRoute>
              } />
              <Route path="my-maintenances" element={
                <RoleBasedRoute allowedRoles={['user', 'corretor']}>
                  <UserMaintenancesPage />
                </RoleBasedRoute>
              } />
              <Route path="maintenance-checkout/:projectId" element={
                <RoleBasedRoute allowedRoles={['user', 'corretor']}>
                  <MaintenanceCheckoutPage />
                </RoleBasedRoute>
              } />
              <Route path="maintenance-requests" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <MaintenanceRequestsPage />
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
              <Route path="users/:userId/assign-plan" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <AssignPlanPage />
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
              <Route path="users/create-admin" element={
                <RoleBasedRoute allowedRoles={['admin', 'dev']}>
                  <CreateAdminPage />
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
              <Route path="payment-settings" element={
                <RoleBasedRoute allowedRoles={['dev']}>
                  <PaymentSettingsPage />
                </RoleBasedRoute>
              } />
              
              {/* Profile */}
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouteTracker>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TransactionLinker />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
