import { useState } from 'react';
import { toast } from 'sonner';

interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const usePropertyCepSearch = () => {
  const [loading, setLoading] = useState(false);

  const searchCep = async (cep: string): Promise<ViaCepAddress | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCepAddress = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return null;
      }

      return data;
    } catch (error) {
      toast.error('Erro ao buscar CEP');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const formatCep = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 5) {
      return cleanValue;
    }
    return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
  };

  return { searchCep, formatCep, loading };
};
