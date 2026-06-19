export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div>
          <h1 className="text-2xl font-bold">Approove</h1>
        </div>

        <div className="space-y-6">
          <blockquote className="text-lg leading-relaxed opacity-90">
            &ldquo;O Approove transformou completamente nosso fluxo de aprovação
            de conteúdo. O que antes levava dias agora se resolve em horas.&rdquo;
          </blockquote>
          <div>
            <p className="font-medium">Marina Silva</p>
            <p className="text-sm opacity-75">
              Diretora de Conteúdo, Agência Criativa
            </p>
          </div>
        </div>

        <div className="flex gap-8 text-sm opacity-75">
          <div>
            <p className="text-2xl font-bold opacity-100">500+</p>
            <p>Calendários aprovados</p>
          </div>
          <div>
            <p className="text-2xl font-bold opacity-100">50+</p>
            <p>Agências ativas</p>
          </div>
          <div>
            <p className="text-2xl font-bold opacity-100">98%</p>
            <p>Satisfação</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
