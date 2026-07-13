import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Política de Privacidade — Approove",
  description: "Política de Privacidade da plataforma Approove.",
};

export default function PrivacidadePage() {
  return (
    <LegalPageLayout title="Política de Privacidade" updatedAt="12 de julho de 2026">
      <p className="text-muted-foreground">
        Este documento é um modelo padrão de Política de Privacidade,
        elaborado com base na Lei Geral de Proteção de Dados (LGPD, Lei nº
        13.709/2018) e disponibilizado como ponto de partida. Recomendamos
        revisão por um advogado ou DPO antes da publicação em produção.
      </p>

      <LegalSection title="1. Quem trata seus dados">
        <p>
          O Approove (&quot;nós&quot;) é o controlador dos dados pessoais
          tratados por meio desta Plataforma, nos termos da LGPD.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <p>Coletamos os seguintes tipos de dados:</p>
        <ul>
          <li>
            <strong>Dados de conta:</strong> nome, e-mail e senha (armazenada
            com hash, nunca em texto plano) de quem se cadastra na
            Plataforma.
          </li>
          <li>
            <strong>Dados da organização:</strong> nome da agência ou empresa
            e informações de cobrança processadas pelo Stripe.
          </li>
          <li>
            <strong>Dados de clientes cadastrados por você:</strong> nome,
            CNPJ, endereço e redes sociais que você cadastrar sobre seus
            próprios clientes.
          </li>
          <li>
            <strong>Conteúdo enviado:</strong> imagens, vídeos, textos de
            publicação, comentários e anotações feitas na Plataforma.
          </li>
          <li>
            <strong>Dados de revisores convidados:</strong> nome e e-mail de
            pessoas convidadas para revisar ou aprovar conteúdo, mesmo sem
            criarem conta.
          </li>
          <li>
            <strong>Dados de uso:</strong> registros técnicos de acesso
            (como data e hora de aprovação de uma publicação), necessários
            para o funcionamento e auditoria da Plataforma.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para que usamos seus dados">
        <ul>
          <li>Fornecer e operar as funcionalidades da Plataforma;</li>
          <li>Processar pagamentos e gerenciar assinaturas;</li>
          <li>
            Enviar e-mails transacionais, como convites de revisores e
            redefinição de senha;
          </li>
          <li>Prevenir fraudes e garantir a segurança da Plataforma;</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Bases legais (LGPD, art. 7º)">
        <p>Tratamos seus dados com base em:</p>
        <ul>
          <li>
            <strong>Execução de contrato:</strong> para fornecer o serviço
            que você contratou;
          </li>
          <li>
            <strong>Legítimo interesse:</strong> para segurança, prevenção a
            fraudes e melhoria do serviço;
          </li>
          <li>
            <strong>Cumprimento de obrigação legal:</strong> para fins fiscais
            e contábeis relacionados à cobrança.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Com quem compartilhamos dados">
        <p>
          Utilizamos os seguintes prestadores de serviço (operadores, nos
          termos da LGPD) para operar a Plataforma:
        </p>
        <ul>
          <li>
            <strong>Stripe</strong> — processamento de pagamentos e gestão de
            assinaturas;
          </li>
          <li>
            <strong>Resend</strong> — envio de e-mails transacionais;
          </li>
          <li>
            <strong>Vercel Blob</strong> — armazenamento de imagens e vídeos
            enviados à Plataforma;
          </li>
          <li>
            <strong>Turso / Neon</strong> — hospedagem do banco de dados da
            aplicação;
          </li>
          <li>
            <strong>Vercel</strong> — hospedagem da aplicação.
          </li>
        </ul>
        <p>
          Não vendemos dados pessoais a terceiros. Dados de clientes e
          revisores só são compartilhados com quem você mesmo convidar por
          meio da Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies">
        <p>
          Utilizamos cookies essenciais para manter sua sessão autenticada
          (via NextAuth) e para lembrar sua preferência de tema (claro/escuro).
          Não utilizamos cookies de rastreamento publicitário.
        </p>
      </LegalSection>

      <LegalSection title="7. Retenção de dados">
        <p>
          Mantemos seus dados enquanto sua conta estiver ativa. Ao solicitar
          o encerramento da conta, os dados pessoais são excluídos ou
          anonimizados em prazo razoável, exceto quando devamos retê-los por
          obrigação legal (por exemplo, dados fiscais de cobrança).
        </p>
      </LegalSection>

      <LegalSection title="8. Seus direitos (LGPD, art. 18)">
        <p>Você pode, a qualquer momento, solicitar:</p>
        <ul>
          <li>Confirmação da existência de tratamento de seus dados;</li>
          <li>Acesso aos seus dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            Anonimização, bloqueio ou eliminação de dados desnecessários ou
            tratados em desconformidade com a lei;
          </li>
          <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
          <li>Eliminação dos dados tratados com base no seu consentimento;</li>
          <li>Informação sobre com quem compartilhamos seus dados;</li>
          <li>Revogação do consentimento, quando aplicável.</li>
        </ul>
        <p>
          Para exercer esses direitos, entre em contato pelo e-mail abaixo.
        </p>
      </LegalSection>

      <LegalSection title="9. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus
          dados, incluindo senhas armazenadas com hash (bcrypt), conexões
          criptografadas (HTTPS) e controle de acesso por organização.
          Nenhum sistema é 100% seguro; caso identifique uma vulnerabilidade,
          entre em contato conosco.
        </p>
      </LegalSection>

      <LegalSection title="10. Menores de idade">
        <p>
          A Plataforma não é direcionada a menores de 18 anos e não coleta
          intencionalmente dados de crianças ou adolescentes.
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações a esta política">
        <p>
          Podemos atualizar esta Política periodicamente. Alterações
          relevantes serão comunicadas por e-mail ou por aviso na Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="12. Contato do controlador / encarregado (DPO)">
        <p>
          Dúvidas, solicitações ou reclamações sobre o tratamento de dados
          pessoais podem ser enviadas para{" "}
          <a href="mailto:contato@approove.app">contato@approove.app</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
