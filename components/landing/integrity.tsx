import { Reveal } from "@/components/landing/reveal";
import { MaskedWords } from "@/components/landing/masked-words";
import { Eyebrow, SectionHeading } from "@/components/landing/ui";
import { ApprovedBadge, Panel } from "@/components/landing/product-frames";
import { amber, cream, green, ink, paper } from "@/components/landing/tokens";
import { localizedText, type AppLocale } from "@/lib/locale";

export function LandingIntegrity({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);

  return (
    <section id="aprovacao" className="scroll-mt-16">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow>{tr("Integridade da aprovação", "Approval integrity")}</Eyebrow>
        <Reveal bare>
          <SectionHeading>
            <MaskedWords text={tr("“Aprovado” precisa significar alguma coisa.", "“Approved” has to mean something.")} />
          </SectionHeading>
        </Reveal>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-snug" style={{ color: "rgba(27,25,23,0.6)" }}>
          {tr(
            "O Approove registra quem aprovou, quando aprovou e qual conteúdo estava vigente naquele momento — arte e legenda.",
            "Approove records who approved, when they approved, and which content was current at that moment — creative and caption."
          )}
        </p>

        <Reveal className="mt-12">
          <div
            className="max-w-md rounded-3xl border p-7"
            style={{ borderColor: "rgba(27,25,23,0.12)", backgroundColor: paper }}
          >
            <ApprovedBadge locale={locale} />
            <p className="mt-5 text-2xl font-extrabold tracking-tight">João Silva</p>
            <p className="mt-1 text-sm font-medium" style={{ color: "rgba(27,25,23,0.5)" }}>
              {tr("30 set · 14:32", "30 Sep · 14:32")}
            </p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between border-t pt-3" style={{ borderColor: "rgba(27,25,23,0.1)" }}>
                <dt style={{ color: "rgba(27,25,23,0.5)" }}>{tr("Arte", "Creative")}</dt>
                <dd className="font-bold">{tr("Versão 3", "Version 3")}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "rgba(27,25,23,0.5)" }}>{tr("Legenda", "Caption")}</dt>
                <dd className="font-bold">{tr("Registro salvo", "Snapshot saved")}</dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingInvalidation({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const steps = locale === "pt-BR"
    ? [
        ["Versão 3", "Aprovado", green],
        ["Legenda editada / nova arte", "", ink],
        ["Aprovação invalidada", "", amber],
        ["Pendente de revisão", "", amber],
      ]
    : [
        ["Version 3", "Approved", green],
        ["Caption edited / new creative", "", ink],
        ["Approval invalidated", "", amber],
        ["Pending review", "", amber],
      ];

  return (
    <section className="border-t" style={{ borderColor: "rgba(27,25,23,0.1)" }}>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow>{tr("Depois da mudança", "After a change")}</Eyebrow>
        <Reveal bare>
          <SectionHeading>
            <MaskedWords text={tr("Mudou a arte ou a legenda? O aprovado anterior deixa de valer.", "Changed the creative or caption? The previous approval no longer stands.")} />
          </SectionHeading>
        </Reveal>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-snug" style={{ color: "rgba(27,25,23,0.6)" }}>
          {tr(
            "O histórico continua registrado, mas a versão atual precisa ser aprovada novamente. Não é um checkbox de status.",
            "The history stays on record, but the current version needs approval again. This is not a status checkbox."
          )}
        </p>
        <Reveal className="mt-12">
          <ol className="grid gap-3 sm:grid-cols-4">
            {steps.map(([title, sub, color], i) => (
              <li
                key={title as string}
                className="rounded-2xl border p-5"
                style={{ borderColor: "rgba(27,25,23,0.12)", backgroundColor: paper }}
              >
                <p className="text-[11px] font-bold" style={{ color: "rgba(27,25,23,0.4)" }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-lg font-extrabold tracking-tight">{title}</p>
                {sub ? (
                  <span
                    className="mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-bold text-white"
                    style={{ backgroundColor: color as string }}
                  >
                    {sub}
                  </span>
                ) : (
                  <span className="mt-3 inline-block h-2 w-8 rounded-full" style={{ backgroundColor: color as string }} />
                )}
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingActivity({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const events = locale === "pt-BR"
    ? [
        ["14:32", "João Silva aprovou a versão v3"],
        ["13:58", "Aprovação invalidada porque uma nova versão da arte foi enviada."],
        ["11:41", "João Silva pediu ajustes"],
        ["Ontem", "Conteúdo enviado para o cliente revisar"],
      ]
    : [
        ["14:32", "João Silva approved version v3"],
        ["13:58", "Approval invalidated because a new creative version was uploaded."],
        ["11:41", "João Silva requested changes"],
        ["Yesterday", "Content submitted for client review"],
      ];

  return (
    <section style={{ backgroundColor: ink, color: cream }}>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow light>{tr("Atividade", "Activity")}</Eyebrow>
        <Reveal bare>
          <h2 className="mt-6 max-w-3xl text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
            <MaskedWords text={tr("Você não precisa lembrar quem aprovou o quê.", "You should not have to remember who approved what.")} />
          </h2>
        </Reveal>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-snug" style={{ color: "rgba(244,233,225,0.55)" }}>
          {tr(
            "O Approove registra as decisões do processo de aprovação: envio para revisão, pedido de ajustes, aprovação e invalidação.",
            "Approove records the decisions in the approval process: submitted for review, changes requested, approved, and invalidated."
          )}
        </p>
        <Reveal className="mt-12 max-w-lg">
          <div className="space-y-0 border-l" style={{ borderColor: "rgba(244,233,225,0.2)" }}>
            {events.map(([when, text], i) => (
              <div key={when as string} className="lp-activity-in pl-5 py-3" style={{ animationDelay: `${i * 90}ms` }}>
                <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(244,233,225,0.4)" }}>
                  {when}
                </p>
                <p className="mt-1 text-sm font-medium leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingFeedback({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);

  return (
    <section>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{tr("Feedback", "Feedback")}</Eyebrow>
            <Reveal bare>
              <SectionHeading>
                <MaskedWords text={tr("Aponte exatamente onde precisa mudar.", "Point to exactly where it needs to change.")} />
              </SectionHeading>
            </Reveal>
            <p className="mt-6 max-w-xl text-lg font-medium leading-snug" style={{ color: "rgba(27,25,23,0.6)" }}>
              {tr(
                "Em imagens, o pin vai direto na arte. Na legenda, o comentário fica no conteúdo. Vídeo não recebe pin no quadro — o comentário descreve o ajuste.",
                "On images, the pin sits on the creative. On captions, comments live with the copy. Video does not get a frame pin — the comment describes the change."
              )}
            </p>
          </div>
          <Reveal>
            <Panel>
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{ background: "linear-gradient(135deg, #0072E3 0%, #AB54F7 100%)" }}
              >
                <div className="aspect-[16/10]" />
                <span className="lp-pin-pulse absolute left-[30%] top-[40%] flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold" style={{ backgroundColor: cream, color: ink }}>
                  1
                </span>
                <span
                  className="absolute left-[42%] top-[22%] max-w-[12rem] rounded-2xl px-3 py-2 text-[12px] font-semibold"
                  style={{ backgroundColor: cream, color: ink }}
                >
                  {tr("Aumentar o logo aqui.", "Make the logo larger here.")}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium" style={{ color: "rgba(27,25,23,0.55)" }}>
                {tr("Em vez de “muda aquele negócio do lado esquerdo.”", "Instead of “change that thing on the left.”")}
              </p>
            </Panel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function LandingVersions({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const items = locale === "pt-BR"
    ? [
        "Várias versões da arte",
        "Navegação pelo histórico",
        "Pins ligados à versão correspondente",
        "Versão vigente identificada",
        "Versões anteriores consultáveis",
        "Aprovação só sobre o pacote vigente",
      ]
    : [
        "Multiple creative versions",
        "History you can browse",
        "Pins tied to the matching version",
        "Current version clearly marked",
        "Earlier versions still viewable",
        "Approval only on the current package",
      ];

  return (
    <section className="border-t" style={{ borderColor: "rgba(27,25,23,0.1)", backgroundColor: "#FDFAF6" }}>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow>{tr("Versões", "Versions")}</Eyebrow>
        <Reveal bare>
          <SectionHeading>
            <MaskedWords text={tr("Cada revisão continua organizada.", "Every revision stays organized.")} />
          </SectionHeading>
        </Reveal>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-snug" style={{ color: "rgba(27,25,23,0.6)" }}>
          {tr(
            "Veja versões anteriores sem correr o risco de aprovar a versão errada.",
            "Review earlier versions without the risk of approving the wrong one."
          )}
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {items.map((item, i) => (
            <Reveal key={item} delay={i * 40}>
              <li className="rounded-2xl border px-5 py-4 text-sm font-semibold" style={{ borderColor: "rgba(27,25,23,0.12)" }}>
                {item}
              </li>
            </Reveal>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full px-3 py-1.5 text-white" style={{ backgroundColor: ink }}>
            {tr("Versão 2 · anterior", "Version 2 · previous")}
          </span>
          <span className="rounded-full px-3 py-1.5 text-white" style={{ backgroundColor: green }}>
            {tr("Versão 3 · vigente", "Version 3 · current")}
          </span>
        </div>
      </div>
    </section>
  );
}

export function LandingRoles({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const roles = locale === "pt-BR"
    ? [
        ["Visualizador", "Vê o calendário. Não comenta nem aprova."],
        ["Revisor", "Vê, comenta e marca pins na arte."],
        ["Aprovador", "Tudo acima, e pode aprovar ou pedir ajustes."],
      ]
    : [
        ["Viewer", "Sees the calendar. Cannot comment or approve."],
        ["Reviewer", "Sees, comments, and pins on the creative."],
        ["Approver", "Everything above, plus approve or request changes."],
      ];

  return (
    <section>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow>{tr("Papéis do cliente", "Client roles")}</Eyebrow>
        <Reveal bare>
          <SectionHeading>
            <MaskedWords text={tr("Nem todo mundo precisa poder aprovar.", "Not everyone needs the power to approve.")} />
          </SectionHeading>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {roles.map(([title, body], i) => (
            <Reveal key={title} delay={i * 60}>
              <div className="h-full rounded-3xl border p-7" style={{ borderColor: "rgba(27,25,23,0.12)", backgroundColor: paper }}>
                <p className="text-sm font-extrabold" style={{ color: "rgba(27,25,23,0.4)" }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-2xl font-extrabold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed" style={{ color: "rgba(27,25,23,0.6)" }}>{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
