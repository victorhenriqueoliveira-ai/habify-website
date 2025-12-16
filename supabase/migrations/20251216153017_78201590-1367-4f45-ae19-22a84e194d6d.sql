-- Performance optimization: Add index for maintenance_credits.project_id
CREATE INDEX IF NOT EXISTS idx_maintenance_credits_project_id ON public.maintenance_credits(project_id);

-- Performance optimization: Add composite index for notifications (user_id + read status)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- Performance optimization: Add index for user_roles queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);