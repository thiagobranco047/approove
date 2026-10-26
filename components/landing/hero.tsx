import { RotatingWord } from "@/components/landing/rotating-word";
import { Reveal } from "@/components/landing/reveal";
import { Parallax } from "@/components/landing/parallax";
import { Eyebrow, PillLink, TrialNote } from "@/components/landing/ui";
import { ApprovedBadge, CalendarStrip, CreativeCanvas, ProductChrome } from "@/components/landing/product-frames";
import { blue } from "@/components/landing/tokens";
import { localizedText, type AppLocale } from "@/lib/locale";
import { marketingPath } from "@/lib/marketing-routes";

function HeroHeadline({ locale }: { locale: AppLocale }) {
  const lines = locale === "pt-BR" ? [["Chega", "de", "aprovar"], ["posts", "pelo"]] : [["Stop", "approving"], ["posts", "on"]];
  const accent = locale === "pt-BR" ? ["WhatsApp.", "E-mail.", "Drive."] : ["WhatsApp.", "email.", "Drive."];
  let wordIndex = 0;

  return (
    <h1 className="max-w-6xl text-[clamp(3rem,10vw,8.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">
      {lines.map((words, lineIdx) => (
        <span key={lineIdx} className="block">
          {words.map((word) => {
            const delay = 750 + wordIndex++ * 70;
            return (
              <span key={word} className="hero-mask mr-[0.22em] last:mr-0">
                <span className="hero-word" style={{ animationDelay: `${delay}ms` }}>
                  {word}
                </span>
              </span>
            );
          })}
        </span>
      ))}
      <span className="block">
        <span className="hero-mask">
          <span className="hero-word" style={{ animationDelay: `${750 + wordIndex * 70}ms`, color: blue }}>
            <RotatingWord words={accent} />
          </span>
        </span>
      </span>
    </h1>
  );
}

function HeroMock({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);

  return (
    <ProductChrome>
      <div className="grid gap-6 p-6 sm:grid-cols-[1.5fr,1fr] sm:p-8">
        <CreativeCanvas locale={locale} versionLabel={tr("Versão vigente", "Current version")} pinComment={tr("Aumentar o logo aqui.", "Make the logo larger here.")} />
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(27,25,23,0.4)" }}>
            {tr("Calendário → Arte → Comentário → Aprovação", "Calendar → Creative → Comment → Approval")}
          </p>
          <ApprovedBadge locale={locale} />
          <div className="rounded-2xl p-3.5 text-[13px] leading-snug" style={{ backgroundColor: "rgba(27,25,23,0.05)" }}>
            <p className="mb-1 font-bold">{tr("João Silva", "João Silva")}</p>
            <p style={{ color: "rgba(27,25,23,0.6)" }}>{tr("30 set · 14:32 · versão 3", "30 Sep · 14:32 · version 3")}</p>
          </div>
          <div className="mt-auto pt-2">
            <CalendarStrip />
          </div>
        </div>
      </div>
    </ProductChrome>
  );
}

export function LandingHero({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);

  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
      <div className="fade-up" style={{ "--d": "550ms" } as React.CSSProperties}>
        <Eyebrow>{tr("Aprovação de conteúdo para agências", "Content approval for agencies")}</Eyebrow>
      </div>
      <div className="mt-6">
        <HeroHeadline locale={locale} />
      </div>
      <div className="mt-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <p
          className="fade-up max-w-lg text-lg font-medium leading-snug"
          style={{ "--d": "1350ms", color: "rgba(27,25,23,0.65)" } as React.CSSProperties}
        >
          {tr(
            "O Approove é o espaço de aprovação de conteúdo para agências. Organize o calendário, envie para revisão e saiba exatamente o que o cliente aprovou — sem espalhar a decisão no WhatsApp, e-mail ou Drive.",
            "Approove is the content-approval workspace for agencies. Organize the calendar, send work for review, and know exactly what the client approved — without chasing decisions across WhatsApp, email, or Drive."
          )}
        </p>
        <div className="fade-up flex flex-wrap items-center gap-3" style={{ "--d": "1500ms" } as React.CSSProperties}>
          <PillLink href="/signup">{tr("Testar grátis", "Start free trial")}</PillLink>
          <PillLink href={marketingPath("how", locale)} variant="outline">
            {tr("Ver como funciona", "See how it works")}
          </PillLink>
        </div>
      </div>
      <div className="fade-up mt-4" style={{ "--d": "1650ms" } as React.CSSProperties}>
        <TrialNote>{tr("15 dias grátis · sem cartão", "15 days free · no credit card")}</TrialNote>
      </div>
      <Reveal className="mt-16">
        <Parallax speed={0.06}>
          <HeroMock locale={locale} />
        </Parallax>
      </Reveal>
    </section>
  );
}
