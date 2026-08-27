import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { getRequestLocale } from "@/lib/request-locale";
import { GoogleAnalytics } from "@/components/google-analytics";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === "pt-BR"
    ? {
        title: "Approove - Validação de Calendário Editorial",
        description: "Plataforma de aprovação de conteúdo para redes sociais. Organize, colabore e aprove publicações com seu time e clientes.",
      }
    : {
        title: "Approove - Editorial Calendar Approval",
        description: "Content approval for social media teams. Organize, collaborate, and approve posts with your team and clients.",
      };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <LocaleProvider locale={locale}>
          <SessionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <CookieConsent />
            </ThemeProvider>
          </SessionProvider>
        </LocaleProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
