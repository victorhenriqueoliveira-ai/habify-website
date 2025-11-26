import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlans } from '@/hooks/usePlans';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AssignPlanPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { plans, loading: plansLoading } = usePlans();
  
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', userId)
          .single();

        if (error) throw error;
        
        if (data) {
          setUserName(data.name);
          setUserEmail(data.email || '');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Erro ao carregar dados do usuário');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlanId || !userId) {
      toast.error('Selecione um plano');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', currentUser?.id)
        .single();

      const { error } = await supabase.rpc('admin_assign_plan_to_user', {
        _user_id: userId,
        _plan_id: selectedPlanId,
        _notes: notes || null,
      });

      if (error) throw error;

      const { data: planDetails } = await supabase
        .from('plans')
        .select('name, price')
        .eq('id', selectedPlanId)
        .single();

      if (planDetails) {
        await supabase.functions.invoke('send-payment-confirmation', {
          body: {
            customerName: userName,
            customerEmail: userEmail,
            planName: planDetails.name,
            planPrice: planDetails.price.toFixed(2),
            paymentMethod: 'MANUAL',
            gateway: 'ADMIN'
          }
        });

        await supabase.functions.invoke('send-admin-notification', {
          body: {
            customerName: userName,
            customerEmail: userEmail,
            planName: planDetails.name,
            planPrice: planDetails.price.toFixed(2),
            paymentMethod: 'MANUAL',
            gateway: 'ADMIN',
            assignedBy: adminProfile?.name || 'Admin'
          }
        });
      }

      toast.success(`Plano atribuído com sucesso para ${userName}`);
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error assigning plan:', error);
      toast.error(error.message || 'Erro ao atribuir plano');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Atribuir Plano Manual</CardTitle>
            <CardDescription>
              Atribuir um plano manualmente para <strong>{userName}</strong>
              {userEmail && ` (${userEmail})`}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="plan">Plano *</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - R$ {plan.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: Plano concedido como cortesia, teste, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/users')}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || !selectedPlanId}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Atribuir Plano
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
