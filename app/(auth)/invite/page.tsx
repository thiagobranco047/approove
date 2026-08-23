"use client";

import { Suspense } from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

function InviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email] = useState(emailParam);
  const [step, setStep] = useState<"send" | "verify">("send");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar código");
        return;
      }

      setStep("verify");
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Erro ao enviar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Digite o código completo de 6 dígitos");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Código inválido");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erro ao verificar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const fullCode = code.join("");

  useEffect(() => {
    if (fullCode.length === 6 && step === "verify") {
      handleVerifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullCode]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight lg:hidden">
          Approove
        </h1>
        <h2 className="text-2xl font-semibold tracking-tight">
          {step === "send" ? "Acessar sua conta" : "Digite o código"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {step === "send"
            ? "Enviaremos um código de acesso para o seu e-mail"
            : `Enviamos um código de 6 dígitos para ${email}`}
        </p>
      </div>

      {step === "send" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                value={email}
                readOnly
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleSendCode}
            className="w-full h-11"
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar código de acesso"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {code.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleVerifyCode}
            className="w-full h-11"
            disabled={loading || fullCode.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar código"
            )}
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep("send");
                setCode(["", "", "", "", "", ""]);
                setError("");
              }}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Voltar
            </button>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0 || loading}
              className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {countdown > 0
                ? `Reenviar em ${countdown}s`
                : "Reenviar código"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteForm />
    </Suspense>
  );
}
