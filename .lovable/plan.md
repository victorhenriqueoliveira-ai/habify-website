
# Auditoria Completa: Criacao de Projetos e Sistema

## Resultado Geral

O sistema esta **majoritariamente funcional**. Os dados do wizard (layout, cores, logo, endereco, contato, CRECI, imoveis) estao sendo salvos corretamente no banco, conforme confirmado pelos projetos existentes. No entanto, identifiquei **5 problemas** que precisam ser corrigidos.

---

## Problema 1: Plano sendo usado DUAS VEZES (CRITICO)

**Impacto:** O credito do usuario pode ser consumido 2x por projeto

No `ProjectWizardPage.tsx` (linha 406), apos criar o projeto via `createProject()`, o codigo chama `usePlanForProject()` novamente. Porem, `createProject()` dentro de `useProjects.ts` (linha 165) **ja consome o plano** internamente para usuarios regulares.

**Resultado:** Para usuarios regulares, o plano e consumido 2 vezes - uma dentro do `createProject` e outra no wizard. A segunda chamada provavelmente falha silenciosamente (nao ha mais plano disponivel), mas gera erro no console e pode causar comportamento inesperado.

**Correcao:** Remover a chamada duplicada `usePlanForProject(selectedPlanId, projectId)` na linha 406 do `ProjectWizardPage.tsx`, pois `createProject` ja cuida disso internamente.

---

## Problema 2: PortfolioPropertiesStep - projectType mapeado incorretamente

**Impacto:** Limites de imoveis/fotos trocados

Na linha 583 do `ProjectWizardPage.tsx`:
```
projectType={projectType === 'realtor_multiple' ? 'corretor' : 'imobiliaria'}
```

O `PortfolioPropertiesStep` usa `projectType === 'corretor'` para definir `maxProperties = 5` e `maxPhotosPerProperty = 5`. Quando o tipo e `single_property` (empreendimento), o componente recebe `'imobiliaria'`, o que limita a `maxProperties = 1` e `maxPhotosPerProperty = 20`. Isso esta **correto** para empreendimento.

Para `realtor_multiple` (corretor), recebe `'corretor'`, limitando a 5 imoveis com 5 fotos cada. Tambem **correto**.

**Veredicto:** Este mapeamento esta funcionando como esperado. Sem correcao necessaria.

---

## Problema 3: Campo `projectId` nao enviado no create-payment para manutencao

**Impacto:** Manutencao pode nao ser vinculada ao projeto correto

No `create-payment/index.ts` (linha 336), `customerData.projectId` e salvo em `payment_data`, porem a interface `PaymentRequest` (linha 10-23) nao inclui `projectId` no tipo `customerData`. Alem disso, o `MaintenanceCheckoutPage` precisa verificar se esta enviando `projectId` corretamente.

**Correcao:** Adicionar `projectId?: string` a interface `PaymentRequest.customerData` no edge function.

---

## Problema 4: useProjectLimits verifica `user.role` diretamente do contexto

**Impacto:** Baixo - funciona na pratica, mas inconsistente com padrao de seguranca

O `useProjectLimits.ts` (linha 26-31) verifica `user.role` do contexto local ao inves de usar a tabela `user_roles`. Diferente de outros hooks que consultam `user_roles` para verificar admin/dev.

**Correcao:** Usar `hasRole` do `AuthContext` ao inves de verificar `user.role` diretamente. O contexto ja importa `useAuth` mas nao usa o `hasRole` de la.

---

## Problema 5: `useUserPlans` faz query com join que pode falhar

**Impacto:** Medio - pode impedir carregamento de planos do usuario

No `useUserPlans.ts` (linhas 68-87), a query usa `user_plans_detailed` (uma view) com um join `plans:plan_id (name, type)`. A view `user_plans_detailed` ja traz `plan_name` e `plan_type`, entao o join adicional com `plans` e redundante e pode causar erros se as colunas da view nao tiverem FK configurada.

**Correcao:** Remover o join desnecessario e usar diretamente os campos `plan_name` e `plan_type` da view.

---

## Campos que ESTAO sendo salvos corretamente

Confirmado pela analise do banco e do codigo:

| Campo | Salvo? | Onde |
|-------|--------|------|
| Layout Choice | Sim | `projects.layout_choice` |
| Color Palette | Sim | `projects.color_palette` |
| Logo URL | Sim | `projects.logo_url` |
| Wizard Data (CRECI, endereco, contato, perfil, paleta) | Sim | `projects.wizard_data` (JSON) |
| Fotos do projeto | Sim | `projects.photos[]` |
| Imoveis do portfolio | Sim | `portfolio_properties` |
| Fotos dos imoveis | Sim | `portfolio_properties.photos[]` |
| Tipo de projeto | Sim | `projects.project_type` |
| Localizacao | Sim | `projects.location` |

---

## Plano de Correcao (Ordem de Execucao)

1. **Corrigir duplicacao de uso de plano** no `ProjectWizardPage.tsx` - remover chamada redundante `usePlanForProject` (linha 406)
2. **Corrigir interface PaymentRequest** no `create-payment/index.ts` - adicionar `projectId` ao tipo
3. **Corrigir useProjectLimits** - usar `hasRole` do AuthContext
4. **Corrigir useUserPlans** - remover join redundante com `plans`
5. Re-deploy da edge function `create-payment`

Tempo estimado: ~15 minutos de implementacao
