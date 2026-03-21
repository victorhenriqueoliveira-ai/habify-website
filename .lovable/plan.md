

## Auditoria de Comunicação do Produto - Diagnóstico e Plano

### Diagnóstico: O que o site comunica hoje

Analisei todas as seções da landing page na ordem em que aparecem:

```text
1. Hero          → "Site para Corretor em 72h" (produto)
2. Features      → Performance, SEO, Mobile First (produto/tecnologia)
3. Portfolio     → Exemplos visuais (produto)
4. LeadCapture   → Como funciona a captação (produto)
5. Technology    → "Não é WordPress" (produto/tecnologia)
6. ProjectTypes  → Tipo de site ideal (produto)
7. Traffic       → Orgânico vs Pago (educacional)
8. Pricing       → Preço R$74,90 (produto)
9. Maintenance   → Manutenção mensal (produto)
10. SEOContent   → Texto SEO (produto/SEO)
11. FAQ          → Perguntas e respostas (produto)
```

**Problema central: 11 seções e NENHUMA fala da dor real do cliente.**

O site inteiro é "olha o que nosso produto faz" sem antes responder "por que eu preciso disso?". A seção `ProblemsSection` (HumanoidSection.tsx) já existe com 4 dores reais (leads perdidos, credibilidade baixa, dependência de portais, leads desorganizados), mas **nunca foi adicionada à página** — não está no `Index.tsx`.

### O que falta para vender

Um corretor que chega no site pensa: "Mais um site de templates?". Ele precisa primeiro se identificar com o problema antes de considerar a solução. A estrutura ideal de persuasão é:

```text
DOR → AGITAÇÃO → SOLUÇÃO → PROVA → OFERTA
```

Hoje o site faz: `SOLUÇÃO → SOLUÇÃO → SOLUÇÃO → OFERTA`. Pula completamente DOR e PROVA SOCIAL forte.

### Plano de Correção

#### 1. Ativar a seção de Problemas/Dor (Index.tsx + HumanoidSection.tsx)
Adicionar o `ProblemsSection` logo **depois do Hero e antes de FeaturesAnimated**. O corretor primeiro se identifica com a dor, depois vê a solução.

Nova ordem:
```text
Hero → PROBLEMAS (dor) → Features (solução) → Portfolio → ...
```

#### 2. Reescrever a seção de Problemas para ser mais visceral
A seção atual é boa mas pode ser mais impactante. Melhorias:
- Headline mais direta: "Seus concorrentes já têm site. E você?"
- Adicionar dados/números que criam urgência ("78% dos compradores pesquisam online antes de contatar um corretor")
- Cards com ícones visuais em vez de apenas texto
- Adicionar um mini-CTA ao final da seção de dor ("Resolva isso agora")

#### 3. Reescrever o subtítulo do Hero para falar da dor primeiro
**Atual:** "Sem WordPress. Sem complicação. Plataforma própria 100% otimizada..."
**Proposto:** "Pare de perder clientes para corretores que já têm site. Sua landing page profissional pronta em 72h — leads direto no WhatsApp, SEO otimizado, pagamento único a partir de R$ 74,90."

A diferença: começa com a dor ("pare de perder clientes") antes de falar do produto.

#### 4. Adicionar seção de Depoimentos/Prova Social (Index.tsx)
O componente `Testimonials.tsx` já existe com 4 depoimentos mas **também não está na página**. Adicionar entre o Portfolio e o LeadCaptureFlow. Prova social é o elemento que mais converte depois da identificação com a dor.

Nova ordem final:
```text
Hero → Problemas → Features → Portfolio → DEPOIMENTOS → LeadCapture → Technology → ProjectTypes → Traffic → Pricing → Maintenance → SEOContent → FAQ
```

### Arquivos a editar

1. **`src/pages/Index.tsx`** — Importar e posicionar `ProblemsSection` e `Testimonials`
2. **`src/components/HumanoidSection.tsx`** — Reescrever com copy mais visceral, ícones e dados de urgência
3. **`src/components/Hero.tsx`** — Ajustar subtítulo para abrir com a dor do cliente
4. **`src/components/Testimonials.tsx`** — Já existe, apenas será importado na página

### Impacto esperado
- O corretor se identifica com o problema antes de ver a solução
- A prova social (depoimentos) valida a decisão
- A estrutura DOR → SOLUÇÃO → PROVA → OFERTA é a mais eficaz em landing pages de alta conversão

