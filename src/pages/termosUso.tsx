import React from "react";

export default function TermosDeUso(): JSX.Element {
  return (
    <main id="termos-de-uso" className="min-h-screen bg-gray-50 text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="rounded-lg shadow p-6 bg-white border-l-4 border-orange-500">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Termos de Uso — Habify</h1>
            <p className="mt-2 text-sm text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </header>

        <article className="prose prose-lg max-w-none bg-white rounded-lg shadow p-6">
          <section>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Bem‑vindo à Habify. Ao acessar ou utilizar a plataforma Habify ("Serviço"), você concorda com estes Termos de Uso
              e com a nossa Política de Privacidade. Caso não concorde, não utilize o Serviço.
            </p>
          </section>

          <section>
            <h2>2. Descrição do Serviço</h2>
            <p>
              A Habify fornece ferramentas para criação de landing pages e sites para corretores e imobiliárias, hospedagem
              básica associada aos projetos, integração com meios de pagamento, área administrativa e serviços complementares
              (manutenção, templates, suporte). A Habify pode alterar, suspender ou descontinuar funcionalidades sem aviso
              prévio, preservadas as obrigações já contratadas.
            </p>
          </section>

          <section>
            <h2>3. Cadastro e Conta</h2>
            <p>
              Para contratar planos ou criar projetos, é necessário cadastrar-se. Você concorda em fornecer dados verdadeiros,
              atualizados e completos. É de sua responsabilidade manter a confidencialidade da sua senha. A Habify pode
              suspender contas com informações inválidas ou em caso de suspeita de fraude.
            </p>
          </section>

          <section>
            <h2>4. Planos, Pagamentos e Créditos</h2>
            <p>
              Os planos de serviço são descritos na plataforma. Pagamentos feitos via gateways (por exemplo: AbacatePay, Hubla,
              Mercado Pago) são processados pelos próprios gateways; a Habify registra o evento quando o webhook confirma o
              pagamento. Créditos e disponibilidades ficam vinculados ao plano contratado: cada compra concede um plano/credito
              conforme descrito na oferta. A Habify não é responsável por falhas do gateway; contudo, compensaremos usuários quando
              comprovada falha da nossa integração.
            </p>
            <p>
              Cancelamentos, reembolsos e políticas específicas sobre cobranças seguem as regras descritas na página do plano ou
              no contrato complementar. Para contestar uma cobrança, contate o suporte informando pedido/ID e evidências.
            </p>
          </section>

          <section>
            <h2>5. Uso Permitido e Proibições</h2>
            <p>
              Você pode usar a plataforma para criar, gerenciar e publicar páginas dentro das funcionalidades oferecidas. É
              proibido utilizar o serviço para fins ilegais, enviar spam, infringir direitos de terceiros (direitos autorais,
              marcas) ou disponibilizar conteúdo discriminatório, pornográfico ilegal, violento ou que incite crimes.
            </p>
          </section>

          <section>
            <h2>6. Conteúdo do Usuário e Responsabilidade</h2>
            <p>
              O conteúdo que você enviar (textos, imagens, logos, documentos) permanece de sua responsabilidade. Você garante
              que possui direitos sobre esse conteúdo e autoriza a Habify a armazená‑lo e exibi‑lo para prestação do serviço.
              A Habify pode remover conteúdo que viole estes Termos ou a legislação aplicável.
            </p>
          </section>

          <section>
            <h2>7. Propriedade Intelectual</h2>
            <p>
              O software, design, logos, marcas, código e documentação da Habify são de propriedade da Habify. O usuário recebe
              uma licença não exclusiva para uso do serviço conforme contratado. Conteúdos criados pelo usuário pertencem ao
              usuário, salvo acordo em contrário.
            </p>
          </section>

          <section>
            <h2>8. Disponibilidade e Limitação de Responsabilidade</h2>
            <p>
              A Habify se esforça para manter o serviço disponível, mas não garante 100% de uptime. Não nos responsabilizamos por
              perdas indiretas, lucros cessantes, perda de dados ou interrupções causadas por terceiros (provedores de pagamento,
              provedores de hospedagem, integrações externas). Nossa responsabilidade máxima por qualquer dano será limitada ao
              valor efetivamente pago pelo usuário à Habify nos últimos 12 meses, salvo disposição legal em contrário.
            </p>
          </section>

          <section>
            <h2>9. Segurança e Proteção de Dados</h2>
            <p>
              Tratamos os dados pessoais conforme nossa Política de Privacidade (link no rodapé). Utilizamos medidas técnicas e
              administrativas razoáveis para proteger os dados, mas nenhum sistema é infalível. Em caso de incidente de segurança
              relevante, comunicaremos os titulares e as autoridades competentes quando exigido por lei.
            </p>
          </section>

          <section>
            <h2>10. Suporte e Comunicação</h2>
            <p>
              O suporte é realizado pelos canais oficiais indicados na plataforma (e‑mail e WhatsApp). Mensagens, notificações e
              comunicações administrativas poderão ser enviadas por e‑mail e/ou por WhatsApp. É responsabilidade do usuário
              manter seus contatos atualizados.
            </p>
          </section>

          <section>
            <h2>11. Alterações nos Termos</h2>
            <p>
              A Habify pode alterar estes Termos periodicamente. Publicaremos a nova versão com a data de atualização. Caso o
              usuário não concorde com a mudança, deverá cessar o uso do Serviço; o uso continuado implicará concordância.
            </p>
          </section>

          <section>
            <h2>12. Rescisão</h2>
            <p>
              A Habify pode suspender ou encerrar contas que violem estes Termos, sujeitas a análises e possíveis medidas corretivas.
              O usuário pode encerrar sua conta seguindo o fluxo na plataforma; obrigações financeiras pendentes poderão subsistir.
            </p>
          </section>

          <section>
            <h2>13. Legislação Aplicável e Foro</h2>
            <p>
              Estes Termos serão regidos pelas leis brasileiras. Para dirimir controvérsias, fica eleito o foro da comarca de São
              Paulo/SP, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2>14. Contato</h2>
            <p>
              Em caso de dúvidas sobre estes Termos ou sobre seus dados pessoais, entre em contato: <br />
              <strong>Email:</strong> <a href="mailto:contato@habify.com.br" className="text-orange-600">contato@habify.com.br</a><br />
            </p>
          </section>

          <footer className="mt-6">
            <p className="text-sm text-gray-600">Ao utilizar a plataforma Habify você concorda com estes Termos de Uso.</p>
          </footer>
        </article>

        <div className="mt-6 flex gap-3">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Voltar
          </a>

          <button
            onClick={() => window.print()}
            className="ml-auto inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Imprimir
          </button>
        </div>
      </div>
    </main>
  );
}
