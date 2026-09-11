// Constantes de negócio centralizadas
export const BUSINESS = {
  whatsapp: {
    number: '5511911103963',
    display: '+55 (11) 91110-3963',
    url: (msg: string) => `https://wa.me/5511911103963?text=${encodeURIComponent(msg)}`,
  },
  email: {
    contact: 'contato@habify.com.br',
  },
  pricing: {
    domainYearly: 40,
    maintenanceMonthly: 54.9,
    guaranteeDays: 30,
  },
  competitor: {
    monthlyPrice: 169,
    yearlyCost: 169 * 12, // 2.028
  },
} as const;
