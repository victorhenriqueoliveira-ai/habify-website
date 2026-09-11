import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GrantMaintenanceCardProps {
  projectId: string;
}

/**
 * Ação de dev/admin pra liberar 30 dias de manutenção pra um cliente sem
 * cobrar — grava exatamente como uma manutenção paga (mesma tabela, mesma
 * validade), só o gateway de pagamento registrado muda.
 */
export const GrantMaintenanceCard = ({ projectId }: GrantMaintenanceCardProps) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [granting, setGranting] = useState(false);

  const handleGrant = async (): Promise<void> => {
    try {
      setGranting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('grant-maintenance', {
        body: { project_id: projectId, requesting_user_id: user.id, notes: notes.trim() || undefined },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Erro ao conceder manutenção');
      }

      toast.success('Manutenção concedida! Válida por 30 dias.');
      setOpen(false);
      setNotes('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao conceder manutenção';
      toast.error(message);
    } finally {
      setGranting(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4 text-primary" />
          Conceder manutenção (dev/admin)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Libera 30 dias de manutenção pra este cliente sem cobrar — útil pra bonificar ou corrigir uma compra que não foi processada.
        </p>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
          <Gift className="h-3.5 w-3.5" />
          Conceder manutenção
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder manutenção sem cobrança</DialogTitle>
            <DialogDescription>
              O cliente recebe 30 dias de manutenção a partir de agora, igual a uma compra normal — só que sem pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="grant-notes">Motivo (opcional, fica registrado internamente)</Label>
            <Textarea
              id="grant-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: cortesia por atraso na entrega, compensação de suporte..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={granting}>
              Cancelar
            </Button>
            <Button onClick={handleGrant} disabled={granting} className="gap-2">
              {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
