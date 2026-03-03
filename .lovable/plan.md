
# Verificador de Dominio + Pagamento Separado

## Visao Geral

Adicionar um novo Step 5 "Dominio" ao wizard de criacao de projeto, onde o usuario pesquisa dominios `.com.br` em tempo real via RDAP do Registro.br, e depois pode pagar o dominio separadamente (R$40) apos a criacao do projeto.

---

## Parte 1: Verificador de Dominio (Step 5 no Wizard)

### Edge Function: `check-domain-availability`

Cria uma edge function que consulta a API RDAP oficial do Registro.br:
- Endpoint: `https://rdap.registro.br/domain/{dominio}.com.br`
- Se retornar 404 -> dominio disponivel
- Se retornar 200 -> dominio ja registrado
- Retorna tambem sugestoes alternativas (ex: se `meusite.com.br` esta ocupado, sugere `meusiteimoveis.com.br`, `meusitecorretor.com.br`, etc.)

### Componente: `DomainStep.tsx`

Novo componente do wizard com:
- Campo de input para digitar o dominio desejado (sem o `.com.br`, que aparece fixo ao lado)
- Botao "Verificar Disponibilidade"
- Resultado visual:
  - **Verde**: "Disponivel!" com icone de check
  - **Vermelho**: "Indisponivel" com icone de X
- Se indisponivel, mostra 3-4 sugestoes alternativas clicaveis
- O dominio escolhido e salvo no `wizardData` e persistido no campo `wizard_data` do projeto
- Campo opcional - o usuario pode pular se ainda nao decidiu o dominio

### Alteracoes no Wizard

- Array `steps` passa de 5 para 6 itens (novo step "Dominio" entre "Dados do Projeto" e "Finalizar")
- Reordenar: Step 0 (Plano) -> Step 1 (Layout) -> Step 2 (Logo) -> Step 3 (Imoveis) -> Step 4 (Dados) -> Step 5 (Dominio)
- O step de dominio nao e obrigatorio - pode avancar sem escolher
- Progress bar atualizada para 6 steps
- Botao "Finalizar" no step 5

---

## Parte 2: Pagamento do Dominio (Cobranca Separada)

### Novo plano no banco de dados

Criar um plano do tipo `domain_registration` na tabela `plans`:
- Nome: "Registro de Dominio .com.br"
- Preco: R$ 40,00
- Tipo: `domain_registration` (novo valor no enum `plan_type`)
- `is_active: true`

### Migracao de banco

- Adicionar `domain_registration` ao enum `plan_type`
- Adicionar coluna `desired_domain` (text, nullable) na tabela `projects` para armazenar o dominio escolhido
- Adicionar coluna `domain_status` (text, nullable) na tabela `projects` com valores: `pending`, `paid`, `registered`, `active`

### Fluxo de pagamento

Apos criar o projeto, na pagina "Meus Projetos" ou na pagina de detalhe do projeto:
- Se o projeto tem `desired_domain` preenchido e `domain_status = 'pending'` (ou null), mostra um banner/card:
  - "Dominio escolhido: **meusite.com.br**"
  - Botao "Pagar Dominio - R$ 40,00"
- O botao redireciona para o checkout usando o fluxo de pagamento existente (AbacatePay) com o plano de dominio
- Apos pagamento confirmado, o `domain_status` atualiza para `paid`
- O admin entao registra o dominio manualmente e atualiza para `registered` e depois `active`

### Pagina de Detalhe do Projeto

Adicionar secao "Dominio" na pagina de detalhe do projeto mostrando:
- Dominio escolhido
- Status atual (Pendente pagamento / Pago / Registrado / Ativo)
- Botao de pagamento se ainda nao pago

---

## Detalhes Tecnicos

### Arquivos a criar:
- `supabase/functions/check-domain-availability/index.ts` - Edge function RDAP
- `src/components/wizard/DomainStep.tsx` - Componente do wizard

### Arquivos a modificar:
- `src/pages/admin/ProjectWizardPage.tsx` - Adicionar step 5, salvar dominio
- `src/types/wizard.ts` - Adicionar campo `desiredDomain` ao WizardData
- `src/pages/admin/ProjectDetailPage.tsx` - Secao de dominio com status e pagamento
- `supabase/config.toml` - Configurar nova edge function
- Migracao SQL: enum `plan_type`, colunas `desired_domain` e `domain_status` na tabela `projects`

### Fluxo resumido:
```text
Wizard Step 5 -> Digita dominio -> Consulta RDAP -> Mostra resultado
                                                 -> Salva no projeto
Pos-criacao -> Meus Projetos -> "Pagar Dominio R$40" -> AbacatePay -> Webhook confirma -> domain_status = 'paid'
```
