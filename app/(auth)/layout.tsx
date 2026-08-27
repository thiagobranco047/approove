import { localizedText } from "@/lib/locale";
import { getRequestLocale } from "@/lib/request-locale";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div>
          <h1 className="text-2xl font-bold">Approove</h1>
        </div>

        <div className="space-y-6">
          <blockquote className="text-lg leading-relaxed opacity-90">
            &ldquo;{tr("O Approove transformou completamente nosso fluxo de aprovação de conteúdo. O que antes levava dias agora se resolve em horas.", "Approove completely transformed our content approval workflow. What used to take days now takes hours.")}&rdquo;
          </blockquote>
          <div>
            <p className="font-medium">Marina Silva</p>
            <p className="text-sm opacity-75">
              {tr("Diretora de Conteúdo, Agência Criativa", "Content Director, Creative Agency")}
            </p>
          </div>
        </div>

        <div className="flex gap-8 text-sm opacity-75">
          <div>
            <p className="text-2xl font-bold opacity-100">500+</p>
            <p>{tr("Calendários aprovados", "Calendars approved")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold opacity-100">50+</p>
            <p>{tr("Agências ativas", "Active agencies")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold opacity-100">98%</p>
            <p>{tr("Satisfação", "Satisfaction")}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
