"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, ExternalLink, Search, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { localizedText } from "@/lib/locale";

interface ClientData {
  id: string;
  name: string;
  slug: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  stats: {
    pending: number;
    approved: number;
    adjustments: number;
    total: number;
  };
  latestToken?: string;
  versions: Array<{ version: string }>;
}

export default function ClientsPage() {
  const locale = useLocale();
  const tr = useCallback(
    (pt: string, en: string) => localizedText(locale, pt, en),
    [locale]
  );
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchClients = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch("/api/clients");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLoadError(
          typeof data.error === "string"
            ? data.error
            : tr("Erro ao carregar clientes. Tente novamente.", "Unable to load clients. Please try again.")
        );
        return;
      }
      setClients(data.clients);
    } catch {
      setLoadError(tr("Erro de conexão. Verifique sua rede e tente novamente.", "Connection error. Check your network and try again."));
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openClientPage = (client: ClientData) => {
    const version = client.versions[0]?.version || "v1";
    const url = client.latestToken
      ? `/c/${client.slug}/${version}?t=${client.latestToken}`
      : `/c/${client.slug}/${version}`;
    window.open(url, "_blank");
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tr("Clientes", "Clients")}</h1>
          <p className="text-muted-foreground">
            {tr("Gerencie sua carteira de clientes", "Manage your client roster")}
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/clients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {tr("Novo Cliente", "New client")}
        </Button>
      </div>

      {clients.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tr("Buscar cliente...", "Search clients...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
            <p className="text-lg font-medium">{tr("Não foi possível carregar os clientes", "Unable to load clients")}</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">{loadError}</p>
            <Button className="mt-4" onClick={() => { setLoading(true); fetchClients(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {tr("Tentar novamente", "Try again")}
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {search ? tr("Nenhum cliente encontrado", "No clients found") : tr("Nenhum cliente cadastrado", "No clients yet")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? tr("Tente outro termo de busca", "Try another search term")
                : tr("Comece adicionando seu primeiro cliente", "Start by adding your first client")}
            </p>
            {!search && (
              <Button
                className="mt-4"
                onClick={() => router.push("/dashboard/clients/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tr("Adicionar Cliente", "Add client")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => {
            const total = client.stats.total;
            const approvedPct =
              total > 0
                ? Math.round((client.stats.approved / total) * 100)
                : 0;

            return (
              <Card
                key={client.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/clients/${client.slug}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="overflow-hidden">
                      <h3 className="font-semibold truncate">{client.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        /{client.slug}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                      title={tr("Abrir calendário (visão do cliente)", "Open calendar (client view)")}
                      onClick={(e) => { e.stopPropagation(); openClientPage(client); }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {total} {tr("publicações", "posts")}
                      </span>
                      <span className="font-medium">{approvedPct}% {tr("aprovado", "approved")}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${approvedPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 hover:bg-green-100"
                    >
                      {client.stats.approved} {tr("aprovadas", "approved")}
                    </Badge>
                    <Badge variant="secondary">
                      {client.stats.pending} {tr("pendentes", "pending")}
                    </Badge>
                    {client.stats.adjustments > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 hover:bg-orange-100"
                      >
                        {client.stats.adjustments} {tr("ajustes", "changes")}
                      </Badge>
                    )}
                  </div>

                  {(client.website || client.instagram || client.facebook || client.linkedin) && (
                    <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t">
                      {client.website && (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                        >
                          Site
                        </a>
                      )}
                      {client.instagram && (
                        <a
                          href={client.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                        >
                          Instagram
                        </a>
                      )}
                      {client.facebook && (
                        <a
                          href={client.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                        >
                          Facebook
                        </a>
                      )}
                      {client.linkedin && (
                        <a
                          href={client.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
