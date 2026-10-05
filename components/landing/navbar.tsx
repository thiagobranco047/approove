import Link from "next/link";
import { Wordmark } from "@/components/landing/ui";
import { localizedText, type AppLocale } from "@/lib/locale";

export function LandingNavbar({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ backgroundColor: "rgba(244,233,225,0.85)", borderColor: "rgba(27,25,23,0.1)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label={tr("Approove - página inicial", "Approove - home")} className="text-xl">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em] md:flex">
          {[
            ["#como-funciona", tr("Como funciona", "How it works")],
            ["#aprovacao", tr("Aprovação", "Approval")],
            ["#funcionalidades", tr("Funcionalidades", "Features")],
            ["#precos", tr("Preços", "Pricing")],
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
            {tr("Entrar", "Log in")}
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full bg-[#1B1917] px-5 py-2.5 text-sm font-semibold text-[#F4E9E1] transition-colors duration-300 hover:bg-[#0072E3] hover:text-white"
          >
            {tr("Testar grátis", "Start free trial")}
          </Link>
        </div>
      </div>
    </header>
  );
}
