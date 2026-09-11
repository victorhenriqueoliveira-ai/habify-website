// Cliente mínimo pra API da Asaas — usado só pro checkout de cartão de
// crédito (PIX continua 100% na AbacatePay). Doc de referência:
// https://docs.asaas.com/reference

const SANDBOX_BASE_URL = 'https://api-sandbox.asaas.com/v3';
const PRODUCTION_BASE_URL = 'https://api.asaas.com/v3';

function getBaseUrl(): string {
  // ASAAS_ENV=sandbox pra testar sem cobrar de verdade. Produção é o padrão.
  return Deno.env.get('ASAAS_ENV') === 'sandbox' ? SANDBOX_BASE_URL : PRODUCTION_BASE_URL;
}

function getApiKey(): string {
  const key = Deno.env.get('ASAAS_API_KEY');
  if (!key) {
    throw new Error('ASAAS_API_KEY não configurada nos secrets do projeto.');
  }
  return key;
}

async function asaasFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Asaas usa esse header customizado em vez de Authorization: Bearer.
      access_token: getApiKey(),
      ...(options.headers || {}),
    },
  });
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  cpfCnpj: string;
}

/**
 * Busca um cliente existente pelo CPF; cria um novo se não achar. A Asaas
 * permite clientes duplicados (não valida unicidade sozinha), então essa
 * checagem evita criar um cadastro novo a cada compra do mesmo CPF.
 */
export async function findOrCreateAsaasCustomer(params: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}): Promise<AsaasCustomer> {
  const searchResponse = await asaasFetch(`/customers?cpfCnpj=${encodeURIComponent(params.cpfCnpj)}&limit=1`);
  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    const existing = searchData?.data?.[0];
    if (existing?.id) {
      return existing as AsaasCustomer;
    }
  }

  const createResponse = await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      cpfCnpj: params.cpfCnpj,
      mobilePhone: params.phone,
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Falha ao criar cliente na Asaas: ${errText}`);
  }

  const created = await createResponse.json();
  if (!created?.id) {
    throw new Error('Asaas não retornou um id de cliente.');
  }
  return created as AsaasCustomer;
}

export interface AsaasPayment {
  id: string;
  status: string;
  invoiceUrl: string;
}

/**
 * Cria uma cobrança de cartão de crédito com checkout hospedado pela Asaas
 * (invoiceUrl) — mesmo padrão do checkout_url da AbacatePay: a gente nunca
 * toca em dado de cartão, o cliente digita tudo na página da Asaas.
 */
export async function createAsaasCreditCardPayment(params: {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
  successUrl: string;
}): Promise<AsaasPayment> {
  const today = new Date().toISOString().slice(0, 10);

  const response = await asaasFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'CREDIT_CARD',
      value: params.value,
      dueDate: today,
      description: params.description,
      externalReference: params.externalReference,
      callback: {
        successUrl: params.successUrl,
        autoRedirect: true,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha ao criar cobrança na Asaas: ${errText}`);
  }

  const data = await response.json();
  if (!data?.id || !data?.invoiceUrl) {
    throw new Error('Resposta inválida da Asaas ao criar cobrança.');
  }
  return data as AsaasPayment;
}
