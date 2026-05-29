// Constantes de negócio centralizadas
export const BUSINESS = {
  whatsapp: {
    number: '5511961769504',
    display: '+55 (11) 96176-9504',
    url: (msg: string) => `https://wa.me/5511961769504?text=${encodeURIComponent(msg)}`,
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
