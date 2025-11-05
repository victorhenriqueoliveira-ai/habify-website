import { useState } from 'react';
import { toast } from 'sonner';

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export const useViaCep = () => {
  const [loading, setLoading] = useState(false);

  const searchCep = async (cep: string): Promise<ViaCepAddress | null> => {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');

    // Valida CEP
    if (cleanCep.length !== 8) {
      toast.error('CEP inválido. Digite 8 dígitos.');
      return null;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching CEP:', error);
      toast.error('Erro ao buscar endereço. Tente novamente.');
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

  return {
    searchCep,
    formatCep,
    loading,
  };
};
