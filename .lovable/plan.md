
# Destacar o botão "Criar meu site agora" na Hero

## Problema
O botão CTA principal está com aparência "apagada" porque usa `shadow-pulse-500/50` (50% opacidade na sombra) e o gradiente laranja pode estar se perdendo contra o fundo escuro.

## Correções no arquivo `src/components/Hero.tsx`

### Botão "Criar meu site agora" (linha 157)

Alterações no className do MagneticButton:

1. **Sombra mais forte**: Trocar `shadow-2xl shadow-pulse-500/50` por `shadow-[0_0_30px_rgba(254,92,2,0.6)]` para criar um glow laranja vibrante ao redor do botão
2. **Hover com glow intenso**: Trocar `hover:shadow-pulse-500/80` por `hover:shadow-[0_0_40px_rgba(254,92,2,0.8)]`
3. **Texto maior e mais impactante**: Trocar `text-base sm:text-lg` por `text-lg sm:text-xl`
4. **Padding maior**: Trocar `px-8 py-4` por `px-10 py-5`
5. **Adicionar animação pulsante sutil**: Adicionar classe `animate-pulse-slow` ou uma animação CSS de pulse no glow para atrair atenção contínua

### Adicionar animação de glow pulsante

Envolver o botão com um efeito de brilho pulsante usando um `::before` pseudo-element via uma div extra, ou aplicar uma animação CSS customizada que faz o box-shadow pulsar entre intensidades.

Resultado: botão laranja vibrante com glow forte, tamanho maior, e animação sutil de pulsação que chama atenção imediatamente.
