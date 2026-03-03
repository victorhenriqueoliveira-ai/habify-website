

## Google Search Console Errors - Fix Plan

### Problems Identified

From the screenshots, Google reports **2 invalid items**:

1. **"O campo FAQPage está duplicado"** - The FAQ schema in `AdvancedSchema.tsx` has **5 questions** that are completely different from the **8 questions** displayed in `FAQSection.tsx`. Google sees the visual FAQ content on the page and a mismatched schema, flagging it as duplicate/inconsistent. The schema must be synced with the actual page content.

2. **Service schema error** - "Criação de Landing Pages Profissionais para Corretores de Imóveis" has 1 critical error. The `Service` schema is missing the required `name` field (Google requires `name` for Service type). Currently it only has `serviceType`.

### Changes

**File: `src/components/seo/AdvancedSchema.tsx`**

1. **Sync FAQ schema with FAQSection.tsx** - Replace the 5 questions in `faqSchema.mainEntity` with the exact 8 questions/answers from `FAQSection.tsx` so the structured data matches the visible page content.

2. **Fix Service schema** - Add the required `name` field and ensure `serviceType` is consistent. Add `description` at the top level too:
   ```
   "name": "Criação de Sites para Corretores de Imóveis",
   "serviceType": "Web Design",
   "description": "Landing page profissional otimizada para corretores..."
   ```

3. **Remove redundant schemas** - The `LocalBusiness` and `Organization` schemas overlap (both claim to be HabiFy at the same address). Keep only `Organization` since HabiFy is a SaaS platform, not a walk-in local business. This avoids potential future Google warnings about conflicting entity types.

### Impact
- Resolves both critical errors in Google Search Console
- FAQ rich results become eligible for enhanced search display
- Service schema becomes valid for Google rich snippets

