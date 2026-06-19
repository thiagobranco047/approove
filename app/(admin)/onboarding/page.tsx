"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  Share2,
  Users,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const steps = [
  {
    icon: CalendarDays,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    title: "Organize seu calendário editorial",
    description:
      "Crie e gerencie publicações para cada cliente com um calendário visual e intuitivo. Defina datas, canais e adicione o conteúdo de cada post.",
  },
  {
    icon: Share2,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    title: "Compartilhe com seus clientes",
    description:
      "Gere links seguros de aprovação para cada cliente. Eles acessam diretamente o calendário sem precisar criar conta — simples e prático.",
  },
  {
    icon: CheckCircle2,
    color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
    title: "Aprovação em tempo real",
    description:
      "Seus clientes aprovam, pedem ajustes ou deixam comentários em cada publicação. Você acompanha o status de tudo em um só lugar.",
  },
  {
    icon: MessageSquare,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    title: "Comentários e feedback",
    description:
      "Thread de comentários em cada post permite uma comunicação clara entre agência e cliente, sem ruídos ou e-mails perdidos.",
  },
  {
    icon: Users,
    color: "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400",
    title: "Colabore com seu time",
    description:
      "Convide membros da sua equipe e atribua clientes a cada pessoa. Todos trabalham juntos com permissões adequadas.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleComplete = async () => {
    try {
      await fetch("/api/user/onboarding", { method: "POST" });
    } catch {
      // Continue even if the API call fails
    }
    router.push("/dashboard");
  };

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-12">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          <div
            className={`mx-auto h-20 w-20 rounded-2xl ${step.color} flex items-center justify-center`}
          >
            <step.icon className="h-10 w-10" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {step.title}
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
              {step.description}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12">
          {isFirst ? (
            <Button
              variant="ghost"
              onClick={handleComplete}
              className="text-muted-foreground"
            >
              Pular
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}

          {isLast ? (
            <Button onClick={handleComplete} size="lg">
              Começar a usar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep((s) => s + 1)} size="lg">
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
