

## Plano de Otimização SEO para Rankings no Google

### Contexto
O site já tem uma boa base de SEO (meta tags, schemas, sitemap, robots.txt). Porém, para competir nas primeiras posições para termos como "site para corretor", "criar site para corretor", etc., há melhorias concretas que podem ser feitas no código.

### O que o Google valoriza para ranking
1. **Conteúdo semântico relevante** (H1, H2s com palavras-chave)
2. **Title tag e meta description otimizados** para CTR
3. **Heading hierarchy correta** (H1 > H2 > H3)
4. **Texto visível rico em keywords** (não stuffing, mas natural)
5. **Dados estruturados válidos**
6. **Performance (Core Web Vitals)**

---

### Mudanças Propostas

#### 1. Otimizar Title Tag e Meta Description (AdvancedSEO.tsx)
**Atual:** `Habify - Criar Site para Corretor de Imóveis | Site Profissional`
**Proposto:** `Site para Corretor de Imóveis | Criar Site Profissional em 72h - HabiFy`

Motivo: Colocar a keyword principal "Site para Corretor de Imóveis" no início do title aumenta relevância. O Google prioriza as primeiras palavras.

**Meta description** ajustada para incluir mais variações de busca naturalmente:
`Crie seu site de corretor de imóveis em 72h. Landing page profissional com captação de leads no WhatsApp, SEO otimizado e pagamento único. Site para corretor e imobiliária que gera vendas 24/7.`

#### 2. Otimizar index.html (fallback antes do React carregar)
Sincronizar o title e description do `index.html` com os mesmos valores otimizados, pois crawlers podem ler o HTML estático antes do JavaScript executar.

#### 3. Otimizar H1 do Hero (Hero.tsx)
**Atual:** `Tenha uma Máquina de Vendas 24/7: Site Profissional entregue em até 72 Horas úteis com captação automática de leads`
**Proposto:** `Site para Corretor de Imóveis: Crie seu Site Profissional em 72h com Captação Automática de Leads`

Motivo: O H1 atual não contém "corretor" nem "imóveis" — as keywords exatas que os corretores buscam. O Google dá peso enorme ao H1.

#### 4. Adicionar seção de texto SEO-rich no Footer ou antes do FAQ
Criar um componente `SEOContent` com um bloco de texto semântico (H2 + parágrafos) usando as variações de busca naturalmente:
- H2: "Site para Corretor de Imóveis — Por que ter o seu?"
- Parágrafos curtos cobrindo: "criar site para corretor", "site de corretor", "site imobiliário", "landing page para corretor", "site para imobiliária"
- Isso dá ao Google texto indexável com as keywords em contexto natural

#### 5. Expandir keywords na meta tag (AdvancedSEO.tsx)
Adicionar variações long-tail que corretores realmente buscam:
- `site de corretor`
- `site de corretor de imóveis`
- `melhor site para corretor`
- `site para vender imóveis`
- `landing page imobiliária`
- `site corretor autônomo`
- `como criar site de corretor`

#### 6. Adicionar alt texts otimizados nas imagens
Verificar e atualizar alt texts das imagens do portfólio com keywords como "site para corretor de imóveis", "exemplo de site imobiliário", etc.

#### 7. Otimizar WebSite schema (AdvancedSchema.tsx)
Adicionar `description` e `alternateName` ao WebSite schema para reforçar keywords:
```json
"alternateName": ["Site para Corretor", "Criar Site Corretor de Imóveis"],
"description": "Plataforma para criar site profissional para corretores de imóveis e imobiliárias"
```

---

### Arquivos a editar
1. **`src/components/seo/AdvancedSEO.tsx`** — Title, description, keywords
2. **`index.html`** — Title e description de fallback
3. **`src/components/Hero.tsx`** — H1 com keywords
4. **`src/components/seo/AdvancedSchema.tsx`** — WebSite schema enriquecido
5. **Novo: `src/components/SEOContent.tsx`** — Bloco de texto semântico
6. **`src/pages/Index.tsx`** — Incluir SEOContent antes do FAQ

### O que NÃO pode ser feito via código (recomendações externas)
- **Google Search Console**: Submeter sitemap e solicitar indexação da URL
- **Backlinks**: Conseguir links de portais imobiliários, CRECI, blogs do setor
- **Google Business Profile**: Criar perfil da HabiFy no Google Meu Negócio
- **Conteúdo contínuo**: Blog com artigos sobre marketing imobiliário (futuro)

