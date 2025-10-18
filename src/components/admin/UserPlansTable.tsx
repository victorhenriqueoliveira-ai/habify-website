import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, Calendar, User } from 'lucide-react';

interface UserPlanData {
  id: string;
  status: string;
  created_at: string;
  used_at?: string;
  expires_at?: string;
  profile: {
    name: string;
    email: string;
  };
  plan: {
    name: string;
    type: string;
  };
  project?: {
    title: string;
  };
}

export const UserPlansTable = ({ userId }: { userId?: string }) => {
  const [userPlans, setUserPlans] = useState<UserPlanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPlans();
  }, [userId]);

  const fetchUserPlans = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_plans')
        .select(`
          id,
          status,
          created_at,
          used_at,
          expires_at,
          profiles:user_id (
            name,
            email
          ),
          plans:plan_id (
            name,
            type
          ),
          projects:used_for_project_id (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setUserPlans(data as any || []);
    } catch (error) {
      console.error('Error fetching user plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Ativo' },
      used: { variant: 'secondary', label: 'Usado' },
      expired: { variant: 'outline', label: 'Expirado' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
    };

    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          Planos dos Usuários ({userPlans.length})
        </h3>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {!userId && <TableHead>Usuário</TableHead>}
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Adquirido</TableHead>
              <TableHead>Usado</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Projeto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={!userId ? 7 : 6} className="text-center text-muted-foreground">
                  Nenhum plano encontrado
                </TableCell>
              </TableRow>
            ) : (
              userPlans.map((up) => (
                <TableRow key={up.id}>
                  {!userId && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{up.profile?.name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{up.profile?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{up.plan?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {up.plan?.type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(up.status)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(up.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {up.used_at ? format(new Date(up.used_at), 'dd/MM/yy HH:mm', { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {up.expires_at ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(up.expires_at), 'dd/MMM/yy', { locale: ptBR })}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {up.project?.title || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
