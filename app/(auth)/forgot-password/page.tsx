"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { localizedText } from "@/lib/locale";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? tr("Erro ao solicitar redefinição. Tente novamente.", "Unable to request a reset. Please try again."));
        return;
      }

      setSent(true);
    } catch {
      setError(tr("Erro ao solicitar redefinição. Tente novamente.", "Unable to request a reset. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight lg:hidden">Approove</h1>
          <h2 className="text-2xl font-semibold tracking-tight">{tr("Verifique seu e-mail", "Check your email")}</h2>
          <p className="text-sm text-muted-foreground">
            {tr("Se", "If")} <strong>{email}</strong> {tr("estiver cadastrado, enviamos um link para redefinir sua senha. O link expira em 1 hora.", "is registered, we sent a password reset link. It expires in 1 hour.")}
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr("Voltar para o login", "Back to login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight lg:hidden">Approove</h1>
        <h2 className="text-2xl font-semibold tracking-tight">{tr("Esqueceu sua senha?", "Forgot your password?")}</h2>
        <p className="text-sm text-muted-foreground">
          {tr("Informe seu e-mail e enviaremos um link para redefinir sua senha.", "Enter your email and we’ll send you a password reset link.")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tr("Enviando...", "Sending...")}
            </>
          ) : (
            tr("Enviar link de redefinição", "Send reset link")
          )}
        </Button>
      </form>

      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {tr("Voltar para o login", "Back to login")}
      </Link>
    </div>
  );
}
