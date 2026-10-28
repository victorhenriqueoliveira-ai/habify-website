/**
 * Fonte única das perguntas frequentes.
 *
 * Antes isto vivia duplicado: o texto em FAQSection.tsx e uma cópia à mão
 * em seo/AdvancedSchema.tsx. Editar um sem o outro faz o markup FAQPage
 * divergir do conteúdo visível, e o Google derruba o rich result.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Quanto tempo leva pra ficar pronto?',
    answer:
      'O site fica no ar no mesmo dia. Você preenche as informações do imóvel no painel, revisa e publica — a compilação e o deploy levam menos de um minuto, e não existe fila de produção.',
  },
  {
    question: 'Preciso entender de tecnologia?',
    answer:
      'Não. Você preenche um formulário com endereço, fotos, preço e metragem, e a plataforma monta o site. Toda a parte técnica — build, hospedagem, SSL, domínio — acontece sozinha nos bastidores.',
  },
  {
    question: 'O site é feito em WordPress?',
    answer:
      'Não. É React.js compilado e servido por CDN, a mesma arquitetura que Airbnb e QuintoAndar usam. Não tem plugin pra atualizar toda semana nem banco de dados pra cair, e o carregamento fica abaixo de 1 segundo.',
  },
  {
    question: 'E o domínio, está incluso?',
    answer:
      'O site já sobe com um endereço funcionando. Se quiser um domínio próprio (seunome.com.br), ele custa cerca de R$ 40 por ano pago direto no registro.br, e a gente conecta pra você sem cobrar nada a mais.',
  },
  {
    question: 'Posso cadastrar mais de um imóvel?',
    answer:
      'Pode. O mesmo valor cobre até cinco imóveis com filtro de busca, cada um com galeria, planta e localização própria — ou um único empreendimento, se for o caso.',
  },
  {
    question: 'O site é meu mesmo?',
    answer:
      'É seu, incluindo o código-fonte, que fica num repositório no seu nome. Não tem contrato de fidelidade: se um dia quiser levar pra outro lugar, você leva.',
  },
  {
    question: 'Como os clientes entram em contato comigo?',
    answer:
      'Todo botão de contato do site abre direto a sua conversa no WhatsApp, com o imóvel já identificado na mensagem. Você não precisa checar painel nem e-mail — o lead chega no seu celular.',
  },
  {
    question: 'E se eu precisar mudar alguma coisa depois?',
    answer:
      'Alterações de conteúdo você faz sozinho pelo painel, quantas vezes quiser. Para mudanças maiores existe a manutenção mensal opcional de R$ 54,90, com prazo de até 72h — e ela é avulsa, você contrata só no mês em que precisar.',
  },
];
