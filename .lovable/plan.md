

## Plano de Melhorias

### 1. Redesign do botão CTA "Criar meu site agora" (Hero.tsx)
Transformar o botão atual em algo impossível de ignorar:
- Tamanho maior (full-width no mobile, generoso no desktop)
- Animação de shimmer/shine contínua mais agressiva
- Ícone de seta animado com bounce
- Micro-texto de urgência abaixo do botão (ex: "Pagamento único • Sem mensalidade • Entrega em 72h")
- Bordas com glow pulsante mais intenso e colorido
- Efeito de escala no hover mais pronunciado (1.08)
- Background com gradiente animado que se move continuamente

### 2. Remover botão "Falar com Especialista" (Hero.tsx)
Remover o `MagneticButton` do WhatsApp da Hero, deixando apenas o CTA principal. O WhatsApp flutuante já existe no canto da tela.

### 3. Remover terceiro exemplo do portfólio (PortfolioShowcasePremium.tsx)
Remover o projeto id '3' — "Empreendimento Único Cor Vibrante" — do array `projects`.

### 4. Renomear "Planos" para "Investimento" na Navbar (Navbar.tsx)
"Investimento" transmite valor em vez de custo, é uma prática comum em landing pages de alta conversão. Atualizar o texto do botão de navegação.

### Arquivos a editar
- `src/components/Hero.tsx` — Redesign CTA, remover botão WhatsApp
- `src/components/PortfolioShowcasePremium.tsx` — Remover projeto id '3'
- `src/components/Navbar.tsx` — "Planos" → "Investimento"

