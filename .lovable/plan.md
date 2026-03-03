
# Auditoria SEO e Performance - HabiFy

## Pontuacao Atual Estimada

- **SEO**: ~85/100 (bom, mas com problemas corrigiveis)
- **Performance**: ~70/100 (varios gargalos identificados)

---

## PROBLEMAS DE PERFORMANCE (Impacto Alto)

### 1. Google Fonts bloqueando renderizacao (CRITICO)
O `index.css` importa 2 fontes externas via `@import url()` que bloqueiam a renderizacao:
- Inter (8 pesos)
- Playfair Display (4 pesos)

**Correcao:** Mover para `<link>` com `display=swap` no `index.html` e adicionar `rel="preconnect"`. Reduzir pesos carregados ao minimo necessario (Inter: 400,500,600,700,800 / Playfair: removida se nao usada).

### 2. Fonte local Brockmann em formato nao otimizado
Usa `.ttf` e `.otf` (pesados). Deveria usar `.woff2`.

**Correcao:** Converter para WOFF2 ou pelo menos adicionar WOFF2 como formato prioritario no `@font-face`.

### 3. Hero background sem width/height no `<img>` principal
O `OptimizedImage` renderiza `<img>` sem `width` e `height` explicitamente definidos, causando CLS (Cumulative Layout Shift).

**Correcao:** Adicionar `width` e `height` props ao OptimizedImage e propagar para o `<img>` tag.

### 4. Logo no Navbar sem dimensoes explicitas
A tag `<img>` do logo (linha 54-60 do Navbar) nao tem `width` e `height`, causando layout shift.

**Correcao:** Adicionar `width="160" height="48"` ao logo.

### 5. Animacoes CSS pesadas no carregamento inicial
Multiplos `animate-pulse`, `animate-float`, `animate-fade-in` no Hero rodam imediatamente. `animate-ping` no WhatsApp button e especialmente pesado.

**Correcao:** Usar `will-change: transform` seletivamente e substituir `animate-ping` por uma animacao mais leve.

### 6. Framer Motion no FloatingWhatsAppButton carregado eagerly
O `FloatingWhatsAppButton` importa `framer-motion` (pesada) e nao e lazy-loaded.

**Correcao:** Lazy-load o FloatingWhatsAppButton ou remover framer-motion dele.

---

## PROBLEMAS DE SEO (Impacto Medio-Alto)

### 7. Dominio inconsistente nos schemas
- `SEO.tsx` usa `https://habify.com`
- `AdvancedSEO.tsx` usa `https://habify.com.br`
- `AdvancedSchema.tsx` usa `https://habify.com.br`
- `StructuredData.tsx` usa `https://habify.com`
- `sitemap.xml` usa `https://habify.com`

**Correcao:** Unificar tudo para `https://habify.com.br` (dominio principal).

### 8. Schemas duplicados entre StructuredData e AdvancedSchema
Ambos os componentes definem FAQ, Organization e WebSite schemas, gerando JSON-LD duplicado no HTML. Google pode ignorar ou penalizar.

**Correcao:** Remover `StructuredData.tsx` e manter apenas `AdvancedSchema.tsx` que e mais completo.

### 9. Sitemap desatualizado
- `lastmod` em todas as URLs e `2025-01-15` (desatualizado)
- Falta a URL `/termos-de-uso` com path correto (esta `/termos-de-uso` mas no sitemap esta como `termos-de-uso`)
- URLs com `#fragment` nao sao ideais para sitemaps (Google ignora fragments)
- Falta URL da pagina `/login`

**Correcao:** Atualizar datas, remover URLs com `#fragment`, manter apenas URLs de paginas completas.

### 10. Meta tags SEO duplicadas entre SEO.tsx e AdvancedSEO.tsx
Ambos definem `<title>`, `<meta description>`, `<meta og:*>` etc. No Index.tsx, apenas AdvancedSEO e usado, mas SEO.tsx fica orfao.

**Correcao:** Remover importacao de `SEO.tsx` de qualquer lugar que use AdvancedSEO.

### 11. Falta `<h2>` semantico em secoes
Varias secoes lazy-loaded provavelmente nao tem heading hierarchy correto. Google penaliza skip de niveis (h1 -> h3).

### 12. Navbar logo sem `<h1>` ou `aria-label` adequado para pagina interna
O logo no Navbar tem `aria-label="HabiFy Logo and Home Link"` mas nao ha relacao semantica clara.

### 13. AggregateRating com dados fabricados
- `AdvancedSchema.tsx` linha 180: `reviewCount: "500"` e `ratingValue: "4.9"`
- `StructuredData.tsx`: `reviewCount: "87"` e `ratingValue: "4.9"` (valores conflitantes!)

Google pode penalizar reviews fabricadas. Se nao tem reviews reais, remover `aggregateRating`.

**Correcao:** Remover `aggregateRating` de ambos os schemas, ou usar numeros reais.

---

## PLANO DE CORRECAO (Priorizado)

### Fase 1 - Performance (impacto maximo)

1. **Otimizar Google Fonts** - Mover de `@import` para `<link>` no `index.html` com `display=swap` e `preconnect`
2. **Adicionar dimensoes explicitas** nas imagens (logo, hero image) para eliminar CLS
3. **Lazy-load FloatingWhatsAppButton** para evitar carregar framer-motion no bundle inicial
4. **Suavizar animacao ping** no WhatsApp button

### Fase 2 - SEO (correcoes criticas)

5. **Unificar dominio** para `habify.com.br` em todos os schemas, metas e sitemap
6. **Remover StructuredData.tsx** (duplicado) - manter apenas AdvancedSchema.tsx
7. **Remover aggregateRating fabricado** dos schemas
8. **Atualizar sitemap.xml** com datas corretas e remover URLs com fragments

### Fase 3 - SEO (refinamentos)

9. **Atualizar robots.txt** com dominio correto no Sitemap
10. **Limpar SEO.tsx** que nao e mais usado na Index page

---

## Detalhes Tecnicos

### Arquivos a modificar:
- `index.html` - preconnect fonts, remover CSS blocking
- `src/index.css` - remover `@import url()` de Google Fonts
- `src/components/Navbar.tsx` - adicionar width/height ao logo
- `src/components/OptimizedImage.tsx` - propagar width/height
- `src/components/FloatingWhatsAppButton.tsx` - suavizar ping animation
- `src/pages/Index.tsx` - remover StructuredData, lazy-load WhatsApp button
- `src/components/seo/AdvancedSchema.tsx` - remover aggregateRating, unificar dominio
- `src/components/seo/AdvancedSEO.tsx` - unificar dominio
- `src/components/StructuredData.tsx` - remover (duplicado)
- `public/sitemap.xml` - atualizar datas e URLs
- `public/robots.txt` - corrigir URL do sitemap
