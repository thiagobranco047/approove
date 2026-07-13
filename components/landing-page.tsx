import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { MaskedWords } from "@/components/landing/masked-words";
import { ScrollFill } from "@/components/landing/scroll-fill";
import { Parallax } from "@/components/landing/parallax";
import { Preloader } from "@/components/landing/preloader";
import { PLAN_LIMITS } from "@/lib/plan-limits";

/*
 * Paleta editorial da landing (referências: units.gr + poetic.com).
 * Cores fixas de marketing — intencionalmente independentes do tema do app.
 * Interações (hover) usam classes Tailwind literais com os mesmos hex.
 */
const ink = "#1B1917";
const cream = "#F4E9E1";
const blue = "#0072E3";
const amber = "#FFB200";
const green = "#00AA3C";
const purple = "#AB54F7";
const coral = "#FF5C38";

// Valores de exibição dos planos. Devem refletir os preços configurados no
// Stripe (STRIPE_PRICE_STARTER / PRO / STUDIO) — atualizar aqui ao mudar lá.
const PLAN_PRICING: Record<string, { price: string; period?: string }> = {
  free: { price: "Grátis" },
  starter: { price: "US$ 25", period: "/mês" },
  pro: { price: "US$ 75", period: "/mês" },
  studio: { price: "US$ 150", period: "/mês" },
};

function limitLabel(value: number | null, singular: string, plural: string) {
  if (value === null) {
    const label = `${plural} ilimitados`;
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return `${value} ${value === 1 ? singular : plural}`;
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.25em]"
      style={{ color: light ? "rgba(244,233,225,0.55)" : "rgba(27,25,23,0.5)" }}
    >
      {children}
    </p>
  );
}

function PillLink({
  href,
  children,
  variant = "solid",
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  light?: boolean;
}) {
  const base =
    "group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-tight transition-colors duration-300";
  const styles =
    variant === "solid"
      ? light
        ? "bg-[#F4E9E1] text-[#1B1917] hover:bg-[#0072E3] hover:text-white"
        : "bg-[#1B1917] text-[#F4E9E1] hover:bg-[#0072E3] hover:text-white"
      : light
        ? "border-[1.5px] border-[#F4E9E1]/40 text-[#F4E9E1] hover:border-[#F4E9E1] hover:bg-[#F4E9E1] hover:text-[#1B1917]"
        : "border-[1.5px] border-[#1B1917]/30 text-[#1B1917] hover:border-[#1B1917] hover:bg-[#1B1917] hover:text-[#F4E9E1]";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-extrabold tracking-tight ${className}`}>
      approove
      <span className="ml-0.5 inline-block h-[0.5em] w-[0.5em] rounded-full" style={{ backgroundColor: blue }} />
    </span>
  );
}

function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ backgroundColor: "rgba(244,233,225,0.85)", borderColor: "rgba(27,25,23,0.1)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="Approove — página inicial" className="text-xl">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em] md:flex">
          {[
            ["#funcionalidades", "Funcionalidades"],
            ["#como-funciona", "Como funciona"],
            ["#precos", "Preços"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="relative opacity-60 transition-opacity duration-200 after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:opacity-100 hover:after:scale-x-100"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full bg-[#1B1917] px-5 py-2.5 text-sm font-semibold text-[#F4E9E1] transition-colors duration-300 hover:bg-[#0072E3] hover:text-white"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroHeadline() {
  const lines = [
    ["Chega", "de", "aprovar"],
    ["posts", "pelo"],
    ["WhatsApp."],
  ];
  let wordIndex = 0;

  return (
    <h1 className="max-w-6xl text-[clamp(3rem,10vw,8.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">
      {lines.map((words, lineIdx) => (
        <span key={lineIdx} className="block">
          {words.map((word) => {
            const delay = 750 + wordIndex++ * 70;
            return (
              <span key={word} className="hero-mask mr-[0.22em] last:mr-0">
                <span
                  className="hero-word"
                  style={{
                    animationDelay: `${delay}ms`,
                    ...(word === "WhatsApp." ? { color: blue } : {}),
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
      <div className="fade-up" style={{ "--d": "550ms" } as React.CSSProperties}>
        <Eyebrow>Aprovação de conteúdo para agências</Eyebrow>
      </div>
      <div className="mt-6">
        <HeroHeadline />
      </div>
      <div className="mt-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <p
          className="fade-up max-w-md text-lg font-medium leading-snug"
          style={{ "--d": "1350ms", color: "rgba(27,25,23,0.65)" } as React.CSSProperties}
        >
          O calendário editorial da sua agência em um só lugar. O cliente
          revisa, comenta direto na arte e aprova por um simples link — sem
          criar conta, sem prints, sem retrabalho.
        </p>
        <div
          className="fade-up flex flex-wrap items-center gap-3"
          style={{ "--d": "1500ms" } as React.CSSProperties}
        >
          <PillLink href="/signup">Começar grátis</PillLink>
          <PillLink href="#precos" variant="outline">
            Ver planos
          </PillLink>
        </div>
      </div>
      <p
        className="fade-up mt-4 text-sm font-medium"
        style={{ "--d": "1650ms", color: "rgba(27,25,23,0.45)" } as React.CSSProperties}
      >
        Plano Free para sempre · Sem cartão de crédito
      </p>
      <Reveal className="mt-16">
        <Parallax speed={0.06}>
          <ApprovalMockup />
        </Parallax>
      </Reveal>
    </section>
  );
}

function ApprovalMockup() {
  return (
    <div
      className="overflow-hidden rounded-3xl border shadow-[0_40px_80px_-40px_rgba(27,25,23,0.4)]"
      style={{ borderColor: "rgba(27,25,23,0.12)", backgroundColor: "#FDFAF6" }}
    >
      <div
        className="flex items-center gap-3 border-b px-5 py-3.5"
        style={{ borderColor: "rgba(27,25,23,0.08)" }}
      >
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: coral }} />
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: amber }} />
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: green }} />
        </div>
        <div
          className="flex-1 rounded-full px-4 py-1.5 text-center text-xs font-medium"
          style={{ backgroundColor: "rgba(27,25,23,0.05)", color: "rgba(27,25,23,0.5)" }}
        >
          approove.app/c/cliente-acme
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[1.6fr,1fr] sm:p-8">
        {/* Arte com pins */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${blue} 0%, ${purple} 100%)`,
          }}
        >
          <div className="aspect-[4/3]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-2.5 text-center">
              <div className="mx-auto h-3.5 w-40 rounded-full bg-white/35" />
              <div className="mx-auto h-3.5 w-28 rounded-full bg-white/25" />
            </div>
          </div>
          <span
            className="absolute left-[20%] top-[26%] flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold"
            style={{ backgroundColor: cream, color: ink, boxShadow: "0 4px 12px rgba(0,0,0,.25)" }}
          >
            1
          </span>
          <span
            className="absolute bottom-[20%] right-[26%] flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold"
            style={{ backgroundColor: cream, color: ink, boxShadow: "0 4px 12px rgba(0,0,0,.25)" }}
          >
            2
          </span>
          <span
            className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: "rgba(27,25,23,0.75)", color: cream }}
          >
            Versão 2
          </span>
        </div>

        {/* Status + comentários */}
        <div className="flex flex-col gap-3">
          <span
            className="inline-flex items-center gap-1.5 self-start rounded-full px-4 py-1.5 text-sm font-bold text-white"
            style={{ backgroundColor: green }}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
            Aprovado
          </span>
          <div className="space-y-2.5 text-[13px] leading-snug">
            <div
              className="rounded-2xl rounded-tl-md p-3.5"
              style={{ backgroundColor: "rgba(27,25,23,0.05)" }}
            >
              <p className="mb-1 font-bold">Cliente</p>
              <p style={{ color: "rgba(27,25,23,0.6)" }}>
                Ajustar o tom do azul no fundo (pin 1)
              </p>
            </div>
            <div
              className="ml-5 rounded-2xl rounded-tr-md p-3.5 text-white"
              style={{ backgroundColor: blue }}
            >
              <p className="mb-1 font-bold">Agência</p>
              <p className="text-white/85">Nova versão enviada com o ajuste ✓</p>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-5 gap-1.5 pt-3">
            {[
              { day: "8", color: green },
              { day: "12", color: green },
              { day: "15", color: amber },
              { day: "19", color: "rgba(27,25,23,0.2)" },
              { day: "23", color: "rgba(27,25,23,0.2)" },
            ].map(({ day, color }) => (
              <div
                key={day}
                className="flex flex-col items-center gap-1.5 rounded-xl border py-2 text-[10px] font-bold"
                style={{ borderColor: "rgba(27,25,23,0.1)", color: "rgba(27,25,23,0.55)" }}
              >
                {day}
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const marqueeItems = [
  "Feed",
  "Stories",
  "Reels",
  "Carrossel",
  "LinkedIn",
  "Pins na arte",
  "Versões",
  "Aprovação por link",
  "Calendário editorial",
];

function Marquee() {
  const strip = (ariaHidden: boolean) => (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {marqueeItems.map((item) => (
        <span
          key={item}
          className="flex items-center whitespace-nowrap text-2xl font-extrabold uppercase tracking-tight sm:text-3xl"
          style={{ color: cream }}
        >
          <span className="px-6">{item}</span>
          <span style={{ color: blue }}>✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="landing-marquee-wrap overflow-hidden border-y py-5"
      style={{ backgroundColor: ink, borderColor: ink }}
    >
      <div className="landing-marquee flex w-max">
        {strip(false)}
        {strip(true)}
      </div>
    </div>
  );
}

const stats = [
  { value: "1", color: blue, label: "link é tudo o que o seu cliente precisa para aprovar" },
  { value: "0", color: amber, label: "contas, senhas ou apps para o cliente instalar" },
  { value: "100%", color: green, label: "do feedback ancorado no pixel exato da arte" },
  { value: "∞", color: purple, label: "versões por arte, com histórico completo de aprovação" },
];

function StatsSection() {
  return (
    <section style={{ backgroundColor: ink, color: cream }}>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <ScrollFill
          text="O aprovadinho ✔ perdido no chat não é processo. É risco."
          accents={{ "É": coral, "risco.": coral }}
          className="max-w-4xl text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]"
        />
        <div className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ value, color, label }, i) => (
            <Reveal key={value} delay={i * 80}>
              <div className="border-t pt-6" style={{ borderColor: "rgba(244,233,225,0.2)" }}>
                <p
                  className="text-[clamp(3.5rem,6vw,5.5rem)] font-extrabold leading-none tracking-[-0.04em]"
                  style={{ color }}
                >
                  {value}
                </p>
                <p className="mt-4 max-w-[26ch] text-sm font-medium leading-snug" style={{ color: "rgba(244,233,225,0.6)" }}>
                  {label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps: {
  number: string;
  title: string;
  description: string;
  card: React.ReactNode;
}[] = [
  {
    number: "/1",
    title: "Monte o calendário.",
    description:
      "Crie o cliente, planeje as publicações do mês e envie as artes — feed, stories, reels, carrossel ou LinkedIn. Cada material aceita múltiplas versões.",
    card: (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 14 }, (_, i) => {
          const filled = [1, 3, 6, 8, 11, 12].includes(i);
          const colors = [blue, amber, green, purple, coral, blue];
          return (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-lg border text-[10px] font-bold"
              style={{
                borderColor: "rgba(27,25,23,0.1)",
                backgroundColor: filled ? colors[[1, 3, 6, 8, 11, 12].indexOf(i)] : "transparent",
                color: filled ? "#fff" : "rgba(27,25,23,0.4)",
              }}
            >
              {i + 3}
            </div>
          );
        })}
      </div>
    ),
  },
  {
    number: "/2",
    title: "Envie um link.",
    description:
      "O cliente acessa direto do navegador, sem cadastro e sem senha. Convide revisores nomeados com papéis — visualizar, revisar ou aprovar.",
    card: (
      <div className="space-y-2.5">
        <div
          className="flex items-center justify-between gap-3 rounded-full border px-4 py-2.5 text-xs font-semibold"
          style={{ borderColor: "rgba(27,25,23,0.15)", color: "rgba(27,25,23,0.6)" }}
        >
          <span className="truncate">approove.app/c/cliente-acme?t=•••••</span>
          <span className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: ink }}>
            Copiar
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["Ana · Aprovadora", green],
            ["Bruno · Revisor", amber],
            ["Carla · Visualizadora", purple],
          ].map(([name, color]) => (
            <span
              key={name as string}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold"
              style={{ borderColor: "rgba(27,25,23,0.12)" }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color as string }} />
              {name}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: "/3",
    title: "Receba o aprovado.",
    description:
      "O cliente comenta direto na arte e aprova post a post. Cada decisão fica registrada com autor e data — respaldo completo para a agência.",
    card: (
      <div className="space-y-2">
        {[
          ["Post do dia 8 · Feed", "Aprovado", green],
          ["Post do dia 12 · Reels", "Aprovado", green],
          ["Post do dia 15 · Stories", "Em ajustes", amber],
        ].map(([label, status, color]) => (
          <div
            key={label as string}
            className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-semibold"
            style={{ borderColor: "rgba(27,25,23,0.1)" }}
          >
            <span style={{ color: "rgba(27,25,23,0.65)" }}>{label}</span>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: color as string }}>
              {status}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="scroll-mt-16">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow>Como funciona</Eyebrow>
        <Reveal bare>
          <h2 className="mt-6 max-w-3xl text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
            <MaskedWords text="Do planejamento ao aprovado em três passos." />
          </h2>
        </Reveal>
        <div className="mt-16 space-y-6">
          {steps.map(({ number, title, description, card }, i) => (
            <Reveal key={number} delay={i * 60}>
              <div
                className="grid gap-8 rounded-3xl border p-7 sm:p-10 md:grid-cols-[1fr,1.1fr] md:items-center"
                style={{ borderColor: "rgba(27,25,23,0.12)", backgroundColor: "#FDFAF6" }}
              >
                <div>
                  <p className="text-sm font-extrabold" style={{ color: blue }}>
                    {number}
                  </p>
                  <h3 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                    {title}
                  </h3>
                  <p className="mt-4 max-w-md font-medium leading-relaxed" style={{ color: "rgba(27,25,23,0.6)" }}>
                    {description}
                  </p>
                </div>
                <div
                  className="rounded-2xl border p-5 sm:p-6"
                  style={{ borderColor: "rgba(27,25,23,0.08)", backgroundColor: cream }}
                >
                  {card}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    color: blue,
    textColor: "#fff",
    title: "Calendário editorial",
    description:
      "Todas as publicações do mês organizadas por cliente, com status visual de cada post.",
  },
  {
    color: amber,
    textColor: ink,
    title: "Pins na arte",
    description:
      "O cliente marca o ponto exato da imagem e comenta ali. Nada de “aquele azul do canto” por áudio.",
  },
  {
    color: purple,
    textColor: "#fff",
    title: "Versionamento",
    description:
      "Cada material guarda todas as versões. Compare, volte atrás e saiba o que foi aprovado.",
  },
  {
    color: green,
    textColor: "#fff",
    title: "Aprovação por link",
    description:
      "Acesso por link seguro, sem conta e sem instalação. Menos atrito, aprovação mais rápida.",
  },
  {
    color: coral,
    textColor: ink,
    title: "Time e revisores",
    description:
      "Papéis definidos para o time da agência e revisores nomeados do lado do cliente.",
  },
  {
    color: ink,
    textColor: cream,
    title: "Histórico completo",
    description:
      "Cada aprovação, ajuste e comentário registrado com autor e data. Respaldo total.",
  },
];

function FeaturesSection() {
  return (
    <section id="funcionalidades" className="scroll-mt-16" style={{ backgroundColor: "#EFE2D6" }}>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow>Funcionalidades</Eyebrow>
        <Reveal bare>
          <h2 className="mt-6 max-w-3xl text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
            <MaskedWords text="Um post. Um universo inteiro de contexto." />
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ color, textColor, title, description }, i) => (
            <Reveal key={title} delay={(i % 3) * 70}>
              <div
                className="group flex min-h-[250px] flex-col justify-between rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:rounded-[2.5rem]"
                style={{ backgroundColor: color, color: textColor }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-extrabold opacity-50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight className="h-7 w-7 opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[1.7rem]">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-sm font-medium leading-snug opacity-75">
                    {description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const planOrder = ["free", "starter", "pro", "studio"] as const;

const planCopy: Record<
  (typeof planOrder)[number],
  { name: string; description: string; highlighted?: boolean }
> = {
  free: { name: "Free", description: "Para testar com seu primeiro cliente" },
  starter: { name: "Starter", description: "Para quem está começando a carteira" },
  pro: { name: "Pro", description: "Para agências em crescimento", highlighted: true },
  studio: { name: "Studio", description: "Para operações com muitos clientes" },
};

function PricingSection() {
  return (
    <section id="precos" className="scroll-mt-16">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Eyebrow>Preços</Eyebrow>
        <Reveal bare>
          <h2 className="mt-6 max-w-3xl text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
            <MaskedWords text="Planos que crescem com a sua carteira." />
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planOrder.map((plan, i) => {
            const { name, description, highlighted } = planCopy[plan];
            const limits = PLAN_LIMITS[plan];
            const pricing = PLAN_PRICING[plan];
            const items = [
              limitLabel(limits.clients, "cliente", "clientes"),
              limitLabel(limits.members, "usuário", "usuários"),
              limitLabel(limits.reviewers, "revisor ativo", "revisores ativos"),
              "Publicações ilimitadas",
              "Aprovação por link",
            ];

            return (
              <Reveal key={plan} delay={i * 70} className="h-full">
                <div
                  className="flex h-full flex-col rounded-3xl border p-7"
                  style={
                    highlighted
                      ? { backgroundColor: blue, borderColor: blue, color: "#fff" }
                      : { borderColor: "rgba(27,25,23,0.15)", backgroundColor: "#FDFAF6" }
                  }
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold tracking-tight">{name}</h3>
                    {highlighted && (
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em]"
                        style={{ backgroundColor: cream, color: ink }}
                      >
                        Popular
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-1 text-sm font-medium"
                    style={{ color: highlighted ? "rgba(255,255,255,0.75)" : "rgba(27,25,23,0.55)" }}
                  >
                    {description}
                  </p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-[-0.03em]">
                      {pricing.price}
                    </span>
                    {pricing.period && (
                      <span
                        className="text-sm font-semibold"
                        style={{ color: highlighted ? "rgba(255,255,255,0.7)" : "rgba(27,25,23,0.5)" }}
                      >
                        {pricing.period}
                      </span>
                    )}
                  </div>
                  <ul className="mt-7 flex-1 space-y-2.5 text-sm font-medium">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0"
                          strokeWidth={3}
                          style={{ color: highlighted ? cream : green }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-colors duration-300 ${
                      highlighted
                        ? "bg-[#F4E9E1] text-[#1B1917] hover:bg-[#1B1917] hover:text-[#F4E9E1]"
                        : "bg-[#1B1917] text-[#F4E9E1] hover:bg-[#0072E3] hover:text-white"
                    }`}
                  >
                    {plan === "free" ? "Começar grátis" : "Assinar"}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-10 text-sm font-medium" style={{ color: "rgba(27,25,23,0.55)" }}>
          Precisa de mais? O plano Enterprise tem clientes, usuários e revisores
          ilimitados —{" "}
          <a href="mailto:contato@approove.app" className="font-bold underline underline-offset-4" style={{ color: ink }}>
            fale com a gente
          </a>
          .
        </p>
      </div>
    </section>
  );
}

const faqs = [
  {
    question: "Meu cliente precisa criar uma conta para aprovar?",
    answer:
      "Não. O cliente recebe um link seguro e acessa o calendário direto do navegador, sem cadastro nem senha. Ele visualiza as artes, comenta e aprova em poucos cliques.",
  },
  {
    question: "Posso testar antes de assinar?",
    answer:
      "Sim. O plano Free é gratuito para sempre e permite gerenciar um cliente com até três revisores ativos — o suficiente para validar o fluxo com um cliente real.",
  },
  {
    question: "Quais formatos de conteúdo o Approove suporta?",
    answer:
      "Feed, Stories, Reels, Carrossel, LinkedIn e outros formatos personalizados. Cada material aceita imagens (JPEG, PNG, GIF, WebP, SVG) e vídeos MP4, com múltiplas versões por arte.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer:
      "Sim. O upgrade e o downgrade podem ser feitos a qualquer momento pelo portal de cobrança, e a mudança vale imediatamente para os limites do seu plano.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 border-t" style={{ borderColor: "rgba(27,25,23,0.12)" }}>
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr,1.6fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <Reveal bare>
              <h2 className="mt-6 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1] tracking-[-0.03em]">
                <MaskedWords text="Perguntas frequentes." />
              </h2>
            </Reveal>
          </div>
          <div>
            {faqs.map(({ question, answer }, i) => (
              <Reveal key={question} delay={i * 50}>
                <details className="group border-t py-6 last:border-b" style={{ borderColor: "rgba(27,25,23,0.15)" }}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-extrabold tracking-tight sm:text-xl [&::-webkit-details-marker]:hidden">
                    {question}
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg font-medium transition-transform duration-300 group-open:rotate-45"
                      style={{ borderColor: "rgba(27,25,23,0.25)" }}
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl font-medium leading-relaxed" style={{ color: "rgba(27,25,23,0.6)" }}>
                    {answer}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section style={{ backgroundColor: ink, color: cream }}>
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-24 sm:px-8">
        <Reveal bare>
          <h2 className="max-w-5xl text-[clamp(2.5rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
            <MaskedWords
              text="Aprove o próximo calendário sem uma única mensagem no WhatsApp."
              accents={{ "WhatsApp.": green }}
            />
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <PillLink href="/signup" light>
              Começar grátis
            </PillLink>
            <p className="text-sm font-medium" style={{ color: "rgba(244,233,225,0.5)" }}>
              Plano Free para sempre · Sem cartão de crédito
            </p>
          </div>
        </Reveal>

        <div className="mt-24 border-t pt-10" style={{ borderColor: "rgba(244,233,225,0.15)" }}>
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <Eyebrow light>Approove</Eyebrow>
              <p className="mt-3 text-sm font-medium" style={{ color: "rgba(244,233,225,0.55)" }}>
                Aprovação de conteúdo para agências e criadores.
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm font-semibold sm:text-right">
              {[
                ["#funcionalidades", "Funcionalidades"],
                ["#precos", "Preços"],
                ["/login", "Entrar"],
                ["/signup", "Criar conta"],
                ["/termos", "Termos de Uso"],
                ["/privacidade", "Privacidade"],
              ].map(([href, label]) =>
                href.startsWith("#") ? (
                  <a key={href} href={href} className="opacity-60 transition-opacity hover:opacity-100">
                    {label}
                  </a>
                ) : (
                  <Link key={href} href={href} className="opacity-60 transition-opacity hover:opacity-100">
                    {label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>

        <Parallax speed={0.12}>
          <p
            aria-hidden
            className="mt-16 select-none text-center text-[clamp(4rem,17vw,15rem)] font-extrabold leading-[0.8] tracking-[-0.05em]"
            style={{ color: "rgba(244,233,225,0.1)" }}
          >
            approove
          </p>
        </Parallax>
        <p className="mt-8 pb-2 text-center text-xs font-medium" style={{ color: "rgba(244,233,225,0.35)" }}>
          © {new Date().getFullYear()} Approove. Todos os direitos reservados.
        </p>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div
      className="lp flex min-h-screen flex-col antialiased"
      style={{ backgroundColor: cream, color: ink }}
    >
      <Preloader />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <StatsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <FaqSection />
      </main>
      <FinalCta />
    </div>
  );
}
