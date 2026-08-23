"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { localizedText } from "@/lib/locale";

type TokenState = "checking" | "valid" | "invalid";

function ResetPasswordForm() {
  const locale = useLocale();
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => setTokenState(data.valid ? "valid" : "invalid"))
      .catch(() => setTokenState("invalid"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(tr("As senhas não coincidem", "Passwords don’t match"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? tr("Erro ao redefinir senha. Tente novamente.", "Unable to reset password. Please try again."));
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError(tr("Erro ao redefinir senha. Tente novamente.", "Unable to reset password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (tokenState === "checking") {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tokenState === "invalid") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight lg:hidden">Approove</h1>
          <h2 className="text-2xl font-semibold tracking-tight">{tr("Link inválido ou expirado", "Invalid or expired link")}</h2>
          <p className="text-sm text-muted-foreground">
            {tr("Este link de redefinição não é mais válido. Solicite um novo para continuar.", "This reset link is no longer valid. Request a new one to continue.")}
          </p>
        </div>
        <Button asChild className="w-full h-11">
          <Link href="/forgot-password">{tr("Solicitar novo link", "Request a new link")}</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight lg:hidden">Approove</h1>
          <h2 className="text-2xl font-semibold tracking-tight">{tr("Senha redefinida!", "Password reset!")}</h2>
          <p className="text-sm text-muted-foreground">
            {tr("Redirecionando para o login...", "Redirecting to login...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight lg:hidden">Approove</h1>
        <h2 className="text-2xl font-semibold tracking-tight">{tr("Escolha uma nova senha", "Choose a new password")}</h2>
        <p className="text-sm text-muted-foreground">
          {tr("Sua nova senha deve ter pelo menos 6 caracteres.", "Your new password must be at least 6 characters.")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">{tr("Nova senha", "New password")}</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{tr("Confirmar nova senha", "Confirm new password")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tr("Redefinindo...", "Resetting...")}
            </>
          ) : (
            tr("Redefinir senha", "Reset password")
          )}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
