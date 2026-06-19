"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check, Copy, Link2, Loader2, Mail, MailWarning, Plus, Trash2, UserPlus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrgClient {
  id: string;
  name: string;
  slug: string;
}

interface ReviewerInvite {
  id: string;
  role: string;
  status: string;
  expiresAt: string | null;
  lastAccessAt: string | null;
  createdAt: string;
  calendarVersion: string;
  calendarVersionId: string;
  token: string;
}

interface Reviewer {
  id: string;
  name: string;
  email: string;
  clients: OrgClient[];
  invites: ReviewerInvite[];
}

const ROLE_LABELS: Record<string, string> = {
  viewer: "Visualizador",
  reviewer: "Revisor",
  approver: "Aprovador",
};

interface ClientReviewersTabProps {
  clientSlug: string;
  clientId: string;
  clientName: string;
  calendarVersionId?: string;
  calendarVersionLabel?: string;
}

export function ClientReviewersTab({
  clientSlug,
  clientId,
  clientName,
  calendarVersionId,
  calendarVersionLabel,
}: ClientReviewersTabProps) {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [orgClients, setOrgClients] = useState<OrgClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<{
    email: string;
    emailSent: boolean;
    emailSkipped: boolean;
    emailError: string | null;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "approver",
    clientIds: [clientId] as string[],
  });

  const fetchReviewers = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/clients/${clientSlug}/reviewers`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Erro ao carregar revisores"
        );
      }
      setReviewers(data.reviewers);
      setOrgClients(data.orgClients);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Erro ao carregar revisores"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [clientSlug]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || form.clientIds.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientSlug}/reviewers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          calendarVersionId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao convidar");
      }
      const data = await res.json();
      setInviteFeedback({
        email: form.email.trim(),
        emailSent: Boolean(data.emailSent),
        emailSkipped: Boolean(data.emailSkipped),
        emailError: typeof data.emailError === "string" ? data.emailError : null,
      });
      setShowForm(false);
      setForm({ name: "", email: "", role: "approver", clientIds: [clientId] });
      await fetchReviewers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao convidar revisor");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm("Revogar este convite? O link deixará de funcionar.")) return;
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "revoked" }),
      });
      if (!res.ok) throw new Error("Erro ao revogar");
      await fetchReviewers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao revogar");
    }
  };

  const handleDeleteReviewer = async (reviewerId: string) => {
    if (!confirm("Remover este revisor e todos os convites associados?")) return;
    try {
      const res = await fetch(`/api/reviewers/${reviewerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      await fetchReviewers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao remover");
    }
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/c/${clientSlug}/${calendarVersionLabel ?? "v1"}?t=${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const toggleClient = (id: string) => {
    setForm((prev) => ({
      ...prev,
      clientIds: prev.clientIds.includes(id)
        ? prev.clientIds.filter((c) => c !== id)
        : [...prev.clientIds, id],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">{loadError}</p>
          <p className="text-xs text-muted-foreground">
            Verifique se você está logado como admin da agência e se o seed foi executado (
            <code className="bg-muted px-1 rounded">npm run db:seed</code>).
          </p>
          <Button size="sm" variant="outline" onClick={() => { setLoading(true); fetchReviewers(); }}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold">Revisores convidados</h3>
          <p className="text-sm text-muted-foreground">
            Pessoas autorizadas a revisar calendários de {clientName} — cada uma com link próprio e empresas vinculadas.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
          {showForm ? "Cancelar" : "Convidar revisor"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo convite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome completo"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="text-sm px-3 py-2 border rounded-lg bg-background"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="text-sm px-3 py-2 border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Papel</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="text-sm px-3 py-2 border rounded-lg bg-background w-full sm:w-auto"
              >
                <option value="viewer">Visualizador — só visualiza</option>
                <option value="reviewer">Revisor — comenta e anota</option>
                <option value="approver">Aprovador — comenta, anota e aprova</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Empresas vinculadas (pode selecionar mais de uma)
              </label>
              <div className="flex flex-wrap gap-2">
                {orgClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleClient(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      form.clientIds.includes(c.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={saving || !form.name || !form.email || form.clientIds.length === 0}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
              Enviar convite
            </Button>
          </CardContent>
        </Card>
      )}

      {inviteFeedback && (
        <Card className={inviteFeedback.emailSent ? "border-green-200 dark:border-green-900" : "border-amber-200 dark:border-amber-900"}>
          <CardContent className="p-4 flex items-start gap-3">
            {inviteFeedback.emailSent ? (
              <Mail className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            ) : (
              <MailWarning className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-sm">
              {inviteFeedback.emailSent ? (
                <p className="font-medium">Convite enviado para {inviteFeedback.email}</p>
              ) : inviteFeedback.emailSkipped ? (
                <>
                  <p className="font-medium">Convite criado — e-mail não configurado</p>
                  <p className="text-muted-foreground">
                    Defina <code className="text-xs bg-muted px-1 py-0.5 rounded">RESEND_API_KEY</code> e{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">EMAIL_FROM</code> no servidor.
                    Enquanto isso, copie o link do revisor abaixo.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Convite criado, mas o e-mail falhou</p>
                  <p className="text-muted-foreground">
                    {inviteFeedback.emailError ?? "Erro desconhecido"} — copie o link manualmente na lista abaixo.
                  </p>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setInviteFeedback(null)}
              >
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reviewers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Nenhum revisor convidado ainda. Use o botão acima para enviar um link personalizado.
          </CardContent>
        </Card>
      ) : (
        reviewers.map((reviewer) => (
          <Card key={reviewer.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{reviewer.name}</p>
                  <p className="text-sm text-muted-foreground">{reviewer.email}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {reviewer.clients.map((c) => (
                      <Badge key={c.id} variant="secondary" className="text-xs">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDeleteReviewer(reviewer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {reviewer.invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 text-sm flex-wrap"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={invite.status === "active" ? "default" : "secondary"}>
                        {invite.status === "revoked" ? "Revogado" : "Ativo"}
                      </Badge>
                      <span className="text-muted-foreground">{ROLE_LABELS[invite.role] ?? invite.role}</span>
                      <span className="text-xs text-muted-foreground">· cal. {invite.calendarVersion}</span>
                      {invite.lastAccessAt && (
                        <span className="text-xs text-muted-foreground">
                          · último acesso {new Date(invite.lastAccessAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {invite.status !== "revoked" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => copyLink(invite.token)}>
                            {copiedToken === invite.token ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            {copiedToken === invite.token ? "Copiado" : "Copiar link"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive"
                            onClick={() => handleRevoke(invite.id)}
                          >
                            Revogar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 flex gap-3 text-sm text-muted-foreground">
          <Link2 className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Cada revisor recebe um link único. O acesso é limitado às empresas selecionadas e ao papel definido.
            Links legados sem convite nomeado continuam funcionando com acesso completo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
