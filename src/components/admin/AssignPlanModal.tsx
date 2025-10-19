import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlans } from '@/hooks/usePlans';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AssignPlanModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export const AssignPlanModal = ({
  open,
  onClose,
  userId,
  userName,
  onSuccess,
}: AssignPlanModalProps) => {
  const { plans, loading: plansLoading } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      toast.error('Selecione um plano');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('admin_assign_plan_to_user', {
        _user_id: userId,
        _plan_id: selectedPlanId,
        _notes: notes || null,
      });

      if (error) throw error;

      toast.success(`Plano atribuído com sucesso para ${userName}`);
      setSelectedPlanId('');
      setNotes('');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error assigning plan:', error);
      toast.error(error.message || 'Erro ao atribuir plano');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atribuir Plano Manual</DialogTitle>
          <DialogDescription>
            Atribuir um plano manualmente para <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Plano</Label>
            {plansLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
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
            )}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedPlanId}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atribuir Plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
