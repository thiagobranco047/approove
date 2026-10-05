"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  INVALIDATION_REASON_COPY,
  type InvalidationReason,
} from "@/lib/approval-types";
import { useLocale } from "@/components/locale-provider";
import { localizedText } from "@/lib/locale";

export interface ActivityEvent {
  id: string;
  type: string;
  actorType: string;
  actorNameSnapshot: string;
  createdAt: string;
  invalidationReason?: string | null;
  creatives?: Array<{ versionNumber: number | null }>;
}

interface ApprovalActivityProps {
  events: ActivityEvent[];
  legacyApproval?: boolean;
}

function versionFromEvent(event: ActivityEvent): string | null {
  const numbers = (event.creatives ?? [])
    .map((item) => item.versionNumber)
    .filter((value): value is number => typeof value === "number");
  if (numbers.length === 0) return null;
  return `v${Math.max(...numbers)}`;
}

export function ApprovalActivity({ events, legacyApproval }: ApprovalActivityProps) {
  const locale = useLocale();
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const dateLocale = locale === "pt-BR" ? ptBR : undefined;

  const lines = events.map((event) => {
    const when = format(new Date(event.createdAt), "d MMM · HH:mm", { locale: dateLocale });
    const name = event.actorNameSnapshot;
    const version = versionFromEvent(event);

    if (event.type === "approved") {
      return {
        id: event.id,
        when,
        text: version
          ? tr(
              `${name} aprovou a versão ${version}`,
              `${name} approved version ${version}`
            )
          : tr(`${name} aprovou este conteúdo`, `${name} approved this content`),
      };
    }

    if (event.type === "changes_requested") {
      return {
        id: event.id,
        when,
        text: tr(`${name} pediu ajustes`, `${name} requested changes`),
      };
    }

    if (event.type === "submitted_for_review") {
      return {
        id: event.id,
        when,
        text: tr("Conteúdo enviado para o cliente revisar", "Content submitted for client review"),
      };
    }

    if (event.type === "approval_invalidated") {
      const reason = event.invalidationReason as InvalidationReason | null;
      const copy = reason ? INVALIDATION_REASON_COPY[reason] : null;
      return {
        id: event.id,
        when,
        text: copy
          ? tr(copy.pt, copy.en)
          : tr("Aprovação anterior foi invalidada.", "Previous approval was invalidated."),
      };
    }

    return { id: event.id, when, text: event.type };
  });

  if (lines.length === 0 && !legacyApproval) return null;

  return (
    <Card data-component="approval-activity">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium">
          {tr("Atividade", "Activity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {legacyApproval && (
          <p className="text-xs text-muted-foreground">
            {tr(
              "Aprovado (registro anterior ao histórico detalhado).",
              "Approved (recorded before detailed history existed)."
            )}
          </p>
        )}
        {lines.map((line) => (
          <div key={line.id} className="border-l-2 border-muted pl-3">
            <p className="text-sm leading-snug">{line.text}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{line.when}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
