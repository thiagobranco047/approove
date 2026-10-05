import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { MaskedWords } from "@/components/landing/masked-words";
import { Eyebrow, SectionHeading } from "@/components/landing/ui";
import { amber, blue, coral, cream, green, ink, purple } from "@/components/landing/tokens";
import { localizedText, type AppLocale } from "@/lib/locale";

export function LandingFeatures({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const features = [
    {
      color: blue,
      textColor: "#fff",
      title: tr("Calendário editorial", "Editorial calendar"),
      description: tr("Publicações organizadas por cliente, com status visível de cada item.", "Posts organized by client, with a visible status for each item."),
    },
    {
      color: amber,
      textColor: ink,
      title: tr("Links de aprovação", "Client approval links"),
      description: tr("O cliente abre o calendário no navegador, pelo celular ou desktop.", "The client opens the calendar in the browser, on phone or desktop."),
    },
    {
      color: purple,
      textColor: "#fff",
      title: tr("Pins na arte", "Creative pins"),
      description: tr("Marca o ponto na imagem. Legenda e vídeo usam comentário no conteúdo.", "Mark the point on the image. Caption and video use comments on the content."),
    },
    {
      color: green,
      textColor: "#fff",
      title: tr("Versões da arte", "Creative versions"),
      description: tr("Histórico navegável, pins por versão e aprovação só no pacote vigente.", "Browsable history, pins per version, and approval only on the current package."),
    },
    {
      color: coral,
      textColor: ink,
      title: tr("Atividade de aprovação", "Approval activity"),
      description: tr("Envio, ajustes, aprovação e invalidação registrados com autor e data.", "Submission, changes, approval, and invalidation recorded with actor and time."),
    },
    {
      color: ink,
      textColor: cream,
      title: tr("Papéis de aprovação", "Approval roles"),
      description: tr("Visualizador, revisor e aprovador. Nem todo mundo aprova.", "Viewer, reviewer, and approver. Not everyone can approve."),
    },
    {
      color: blue,
      textColor: "#fff",
      title: tr("Etapas internas", "Internal production stages"),
      description: tr("Copy, design, revisão interna e pronto para cliente — fora da vista do cliente.", "Copy, design, internal review, and ready for client — out of the client’s sight."),
    },
    {
      color: amber,
      textColor: ink,
      title: tr("Atribuições e handoff", "Assignments & handoff"),
      description: tr("Passe o post para o próximo responsável, sem tratar isso como projeto genérico.", "Hand the post to the next owner, without turning this into generic project management."),
    },
    {
      color: purple,
      textColor: "#fff",
      title: tr("Minhas tarefas", "My Tasks"),
      description: tr("O que está com você, antes de ir para o cliente.", "What is on you, before it goes to the client."),
    },
    {
      color: green,
      textColor: "#fff",
      title: tr("Upload em lote", "Batch upload"),
      description: tr("Envie várias artes de uma vez para montar o calendário.", "Upload several creatives at once to fill the calendar."),
    },
    {
      color: coral,
      textColor: ink,
      title: tr("Carrosséis", "Carousels"),
      description: tr("Slides organizados, com versões e revisão no mesmo fluxo.", "Organized slides, with versions and review in the same flow."),
    },
    {
      color: ink,
      textColor: cream,
      title: tr("Revogação de acesso", "Access revocation"),
      description: tr("Convites de revisor podem ser revogados quando o acesso não deve continuar.", "Reviewer invites can be revoked when access should stop."),
    },
  ];

  return (
    <section id="funcionalidades" className="scroll-mt-16" style={{ backgroundColor: "#EFE2D6" }}>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow>{tr("Funcionalidades", "Features")}</Eyebrow>
        <Reveal bare>
          <SectionHeading>
            <MaskedWords text={tr("O que o Approove faz hoje.", "What Approove does today.")} />
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ color, textColor, title, description }, i) => (
            <Reveal key={title} delay={(i % 3) * 70}>
              <div
                className="group flex min-h-[220px] flex-col justify-between rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:rounded-[2.5rem]"
                style={{ backgroundColor: color, color: textColor }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-extrabold opacity-50">{String(i + 1).padStart(2, "0")}</span>
                  <ArrowUpRight className="h-7 w-7 opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[1.7rem]">{title}</h3>
                  <p className="mt-2.5 text-sm font-medium leading-snug opacity-75">{description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
