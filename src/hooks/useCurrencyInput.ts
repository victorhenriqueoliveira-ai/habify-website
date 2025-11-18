import { useState } from 'react';

export const useCurrencyInput = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);

  const formatToCurrency = (numericValue: string): string => {
    // Remove tudo que não é número
    const cleanValue = numericValue.replace(/\D/g, '');
    
    if (!cleanValue) return '';
    
    // Converte para número dividindo por 100 (para considerar centavos)
    const numberValue = parseFloat(cleanValue) / 100;
    
    // Formata para moeda brasileira
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleChange = (inputValue: string) => {
    const formatted = formatToCurrency(inputValue);
    setValue(formatted);
    return formatted;
  };

  const getNumericValue = (): number => {
    const cleanValue = value.replace(/\D/g, '');
    return parseFloat(cleanValue) / 100 || 0;
  };

  const setNumericValue = (numericValue: number) => {
    const formatted = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setValue(formatted);
  };

  return {
    value,
    setValue,
    handleChange,
    getNumericValue,
    setNumericValue,
    formatToCurrency,
  };
};
