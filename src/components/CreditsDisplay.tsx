import { Coins } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export const CreditsDisplay = () => {
  const { credits, loading } = useCredits();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
        <Coins className="h-5 w-5 text-muted-foreground animate-pulse" />
        <span className="text-sm text-muted-foreground">...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
        <Coins className="h-5 w-5 text-primary" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Créditos</span>
          <span className="text-lg font-bold">{credits}</span>
        </div>
      </div>
      
      {credits < 1 && (
        <Button 
          size="sm" 
          onClick={() => navigate('/payment-success')}
          className="whitespace-nowrap"
        >
          Comprar Créditos
        </Button>
      )}
    </div>
  );
};
