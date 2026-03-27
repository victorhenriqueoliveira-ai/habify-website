import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Política de Privacidade | HabiFy</title>
        <meta name="description" content="Política de Privacidade da HabiFy - Saiba como coletamos, usamos e protegemos seus dados pessoais conforme a LGPD." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <article className="prose prose-sm sm:prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
            <p className="text-muted-foreground">Última atualização: 27 de março de 2026</p>

            <p>
              A <strong>HabiFy</strong> ("nós", "nosso") opera a plataforma acessível em{' '}
              <a href="https://habify.com.br" className="text-primary">habify.com.br</a>. Esta
              Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos
              seus dados pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados
              (LGPD — Lei nº 13.709/2018)</strong>.
            </p>

            <h2>1. Dados Pessoais Coletados</h2>
            <p>Podemos coletar os seguintes dados pessoais:</p>
            <ul>
              <li><strong>Dados de identificação:</strong> nome completo, CPF, e-mail, telefone.</li>
              <li><strong>Dados de acesso:</strong> endereço IP, tipo de navegador, páginas visitadas, data e hora de acesso.</li>
              <li><strong>Dados de pagamento:</strong> informações necessárias para processamento de pagamentos via PIX ou cartão de crédito, processados por gateways terceiros (AbacatePay). <em>Não armazenamos dados completos de cartão de crédito.</em></li>
              <li><strong>Dados profissionais:</strong> nome da empresa/imobiliária, CRECI (quando fornecido voluntariamente).</li>
              <li><strong>Dados de uso:</strong> interações com a plataforma, projetos criados, solicitações de manutenção.</li>
            </ul>

            <h2>2. Finalidade do Tratamento</h2>
            <p>Seus dados pessoais são tratados para as seguintes finalidades:</p>
            <ul>
              <li>Criação e gestão da sua conta na plataforma.</li>
              <li>Processamento de pagamentos e emissão de comprovantes.</li>
              <li>Criação e entrega dos projetos de landing pages contratados.</li>
              <li>Comunicação sobre o andamento dos seus projetos e serviços contratados.</li>
              <li>Envio de notificações relevantes sobre sua conta (vencimentos, atualizações).</li>
              <li>Cumprimento de obrigações legais e regulatórias.</li>
              <li>Melhoria da plataforma e da experiência do usuário.</li>
            </ul>

            <h2>3. Base Legal para o Tratamento</h2>
            <p>O tratamento dos seus dados pessoais é realizado com base em:</p>
            <ul>
              <li><strong>Execução de contrato</strong> (Art. 7º, V da LGPD): para a prestação dos serviços contratados.</li>
              <li><strong>Consentimento</strong> (Art. 7º, I da LGPD): quando você aceita os Termos de Uso e esta Política de Privacidade durante o cadastro ou checkout.</li>
              <li><strong>Interesse legítimo</strong> (Art. 7º, IX da LGPD): para melhoria dos nossos serviços e segurança da plataforma.</li>
              <li><strong>Cumprimento de obrigação legal</strong> (Art. 7º, II da LGPD): para atender exigências fiscais e regulatórias.</li>
            </ul>

            <h2>4. Compartilhamento de Dados</h2>
            <p>Seus dados pessoais podem ser compartilhados com:</p>
            <ul>
              <li><strong>Processadores de pagamento:</strong> AbacatePay, para processamento de transações financeiras.</li>
              <li><strong>Provedores de infraestrutura:</strong> Supabase (banco de dados e autenticação), Vercel (hospedagem).</li>
              <li><strong>Serviços de e-mail:</strong> Resend, para envio de notificações transacionais.</li>
              <li><strong>Autoridades competentes:</strong> quando exigido por lei ou ordem judicial.</li>
            </ul>
            <p>Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros para fins de marketing.</p>

            <h2>5. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS/SSL)
              e em repouso. Adotamos medidas técnicas e organizacionais para proteger seus dados contra
              acesso não autorizado, destruição, perda ou alteração, incluindo:
            </p>
            <ul>
              <li>Controle de acesso baseado em funções (RBAC).</li>
              <li>Políticas de segurança em nível de linha (Row-Level Security).</li>
              <li>Senhas armazenadas com hash criptográfico (nunca em texto puro).</li>
              <li>Monitoramento e logs de auditoria.</li>
            </ul>

            <h2>6. Tempo de Retenção</h2>
            <p>Seus dados pessoais serão mantidos pelo tempo necessário para:</p>
            <ul>
              <li>A prestação dos serviços contratados.</li>
              <li>O cumprimento de obrigações legais e fiscais (mínimo de 5 anos para dados fiscais).</li>
              <li>A resolução de disputas ou exercício regular de direitos.</li>
            </ul>
            <p>Após o término da relação contratual e dos prazos legais, os dados serão anonimizados ou eliminados.</p>

            <h2>7. Direitos do Titular (Art. 18 da LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul>
              <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los.</li>
              <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade.</li>
              <li><strong>Portabilidade:</strong> obter seus dados em formato estruturado.</li>
              <li><strong>Eliminação:</strong> solicitar a exclusão dos dados tratados com base no consentimento.</li>
              <li><strong>Informação:</strong> saber com quem seus dados são compartilhados.</li>
              <li><strong>Revogação do consentimento:</strong> retirar seu consentimento a qualquer momento.</li>
            </ul>
            <p>
              Para exercer seus direitos, acesse a seção "Meu Perfil" na plataforma ou entre em
              contato pelo e-mail abaixo.
            </p>

            <h2>8. Cookies e Tecnologias de Rastreamento</h2>
            <p>
              Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação e sessão).
              Podemos utilizar ferramentas de análise (Google Analytics/Tag Manager) para compreender o
              uso da plataforma. Você pode gerenciar cookies nas configurações do seu navegador.
            </p>

            <h2>9. Transferência Internacional de Dados</h2>
            <p>
              Seus dados podem ser processados em servidores localizados fora do Brasil (serviços de
              nuvem). Garantimos que essas transferências ocorram em conformidade com a LGPD, mediante
              cláusulas contratuais adequadas ou certificações dos provedores.
            </p>

            <h2>10. Encarregado de Proteção de Dados (DPO)</h2>
            <p>
              Para questões relacionadas à privacidade e proteção de dados, entre em contato com nosso
              encarregado:
            </p>
            <ul>
              <li><strong>E-mail:</strong> contato@habify.com.br</li>
              <li><strong>WhatsApp:</strong> +55 (11) 96176-9504</li>
            </ul>

            <h2>11. Alterações nesta Política</h2>
            <p>
              Reservamo-nos o direito de atualizar esta Política de Privacidade periodicamente.
              Alterações significativas serão comunicadas por e-mail ou notificação na plataforma.
              O uso continuado da plataforma após as alterações constitui aceite das novas condições.
            </p>

            <h2>12. Legislação Aplicável</h2>
            <p>
              Esta Política de Privacidade é regida pela legislação brasileira, em especial a
              Lei nº 13.709/2018 (LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).
              Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias.
            </p>
          </article>
        </div>
      </div>
    </>
  );
};

export default PoliticaPrivacidade;
