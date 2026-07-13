import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Termos de Uso — Approove",
  description: "Termos de Uso da plataforma Approove.",
};

export default function TermosPage() {
  return (
    <LegalPageLayout title="Termos de Uso" updatedAt="12 de julho de 2026">
      <p className="text-muted-foreground">
        Este documento é um modelo padrão de Termos de Uso, disponibilizado
        como ponto de partida. Recomendamos revisão por um advogado antes da
        publicação em produção, para adequação à razão social, ao CNPJ e às
        particularidades comerciais da empresa.
      </p>

      <LegalSection title="1. Aceitação dos termos">
        <p>
          Ao criar uma conta ou utilizar o Approove (&quot;Plataforma&quot;),
          você concorda com estes Termos de Uso e com a nossa{" "}
          <a href="/privacidade">Política de Privacidade</a>. Se você não
          concordar com algum destes termos, não utilize a Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="2. Descrição do serviço">
        <p>
          O Approove é uma plataforma de aprovação de conteúdo para redes
          sociais, que permite a agências e times de marketing organizar
          calendários editoriais, colaborar com clientes e obter aprovações
          de publicações por meio de links de compartilhamento.
        </p>
      </LegalSection>

      <LegalSection title="3. Contas e responsabilidade pelo acesso">
        <ul>
          <li>Você é responsável por manter a confidencialidade da sua senha.</li>
          <li>
            Você é responsável por todas as atividades realizadas na sua
            conta e nas contas dos membros do seu time que você convidar.
          </li>
          <li>
            Links de compartilhamento e convites de revisores dão acesso a
            conteúdo do seu cliente sem exigir criação de conta — cabe a você
            controlar a quem esses links são enviados.
          </li>
          <li>
            Notifique-nos imediatamente em caso de uso não autorizado da sua
            conta.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Planos, cobrança e cancelamento">
        <ul>
          <li>
            O Approove oferece um plano gratuito com limites de uso e planos
            pagos com limites maiores, cobrados por assinatura recorrente
            através do Stripe.
          </li>
          <li>
            Os valores, limites e recursos de cada plano estão descritos na
            página de preços da Plataforma e podem ser alterados mediante
            aviso prévio.
          </li>
          <li>
            Você pode cancelar sua assinatura a qualquer momento pelo portal
            de cobrança; o acesso aos recursos do plano pago permanece até o
            fim do período já pago.
          </li>
          <li>
            Não há reembolso de valores já pagos, exceto quando exigido por
            lei ou a nosso critério.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Conteúdo enviado por você">
        <p>
          Você mantém todos os direitos sobre as artes, textos e demais
          materiais que enviar à Plataforma (&quot;Conteúdo&quot;). Ao enviar
          Conteúdo, você nos concede uma licença limitada, não exclusiva,
          para armazenar, processar e exibir esse Conteúdo exclusivamente
          para operar o serviço — por exemplo, exibi-lo aos revisores do
          cliente através de um link de aprovação.
        </p>
        <p>
          Você declara ter os direitos necessários sobre o Conteúdo enviado e
          é o único responsável por ele.
        </p>
      </LegalSection>

      <LegalSection title="6. Uso aceitável">
        <p>Ao usar a Plataforma, você concorda em não:</p>
        <ul>
          <li>
            Enviar conteúdo ilegal, difamatório, ou que viole direitos de
            terceiros;
          </li>
          <li>Tentar obter acesso não autorizado a contas ou dados de outros usuários;</li>
          <li>
            Utilizar a Plataforma para distribuir malware ou realizar
            ataques a sistemas;
          </li>
          <li>
            Utilizar links de compartilhamento fora do contexto de aprovação
            de conteúdo para o qual foram gerados.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Suspensão e encerramento">
        <p>
          Podemos suspender ou encerrar o acesso à sua conta em caso de
          violação destes Termos, uso fraudulento ou inadimplência. Você pode
          encerrar sua conta a qualquer momento entrando em contato conosco.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitação de responsabilidade">
        <p>
          A Plataforma é fornecida &quot;como está&quot;. Na máxima extensão
          permitida por lei, não nos responsabilizamos por danos indiretos,
          lucros cessantes ou perda de dados decorrentes do uso ou da
          impossibilidade de uso da Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="9. Alterações a estes termos">
        <p>
          Podemos atualizar estes Termos periodicamente. Alterações
          relevantes serão comunicadas por e-mail ou por aviso na Plataforma.
          O uso continuado após a alteração constitui aceitação dos novos
          termos.
        </p>
      </LegalSection>

      <LegalSection title="10. Lei aplicável">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do
          Brasil. Fica eleito o foro da comarca da sede da empresa para
          dirimir eventuais controvérsias.
        </p>
      </LegalSection>

      <LegalSection title="11. Contato">
        <p>
          Dúvidas sobre estes Termos podem ser enviadas para{" "}
          <a href="mailto:contato@approove.app">contato@approove.app</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
