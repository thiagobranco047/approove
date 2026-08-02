"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  ExternalLink,
  Search,
  Users,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react";

const DELETE_CONFIRMATION_WORD = "DELETAR";

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
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoadError(null);
    try {
      const response = await fetch("/api/clients");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLoadError(
          typeof data.error === "string"
            ? data.error
            : "Erro ao carregar clientes. Tente novamente."
        );
        return;
      }
      setClients(data.clients);
    } catch {
      setLoadError("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const openClientPage = (client: ClientData) => {
    const version = client.versions[0]?.version || "v1";
    const url = client.latestToken
      ? `/c/${client.slug}/${version}?t=${client.latestToken}`
      : `/c/${client.slug}/${version}`;
    window.open(url, "_blank");
  };

  const openDeleteDialog = (client: ClientData) => {
    setClientToDelete(client);
    setDeleteConfirmation("");
    setDeleteError(null);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setClientToDelete(null);
    setDeleteConfirmation("");
    setDeleteError(null);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete || deleteConfirmation !== DELETE_CONFIRMATION_WORD) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/clients/${clientToDelete.slug}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(
          typeof data.error === "string"
            ? data.error
            : "Erro ao deletar cliente. Tente novamente."
        );
        return;
      }

      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setClientToDelete(null);
      setDeleteConfirmation("");
    } catch {
      setDeleteError("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const canConfirmDelete = deleteConfirmation === DELETE_CONFIRMATION_WORD;

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua carteira de clientes
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/clients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {clients.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
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
            <p className="text-lg font-medium">Não foi possível carregar os clientes</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">{loadError}</p>
            <Button className="mt-4" onClick={() => { setLoading(true); fetchClients(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
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
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Tente outro termo de busca"
                : "Comece adicionando seu primeiro cliente"}
            </p>
            {!search && (
              <Button
                className="mt-4"
                onClick={() => router.push("/dashboard/clients/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cliente
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
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Abrir calendário (visão do cliente)"
                        onClick={(e) => {
                          e.stopPropagation();
                          openClientPage(client);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Deletar cliente"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(client);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {total} publicações
                      </span>
                      <span className="font-medium">{approvedPct}% aprovado</span>
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
                      {client.stats.approved} aprovadas
                    </Badge>
                    <Badge variant="secondary">
                      {client.stats.pending} pendentes
                    </Badge>
                    {client.stats.adjustments > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 hover:bg-orange-100"
                      >
                        {client.stats.adjustments} ajustes
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

      <Dialog
        open={!!clientToDelete}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar cliente</DialogTitle>
            <DialogDescription>
              Esta ação é permanente e remove o cliente{" "}
              <span className="font-medium text-foreground">
                {clientToDelete?.name}
              </span>
              , incluindo publicações, artes e revisores vinculados. Para
              confirmar, digite{" "}
              <span className="font-semibold text-foreground">
                {DELETE_CONFIRMATION_WORD}
              </span>{" "}
              abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirmation">Confirmação</Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={DELETE_CONFIRMATION_WORD}
              autoComplete="off"
              disabled={deleting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canConfirmDelete && !deleting) {
                  handleDeleteClient();
                }
              }}
            />
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={!canConfirmDelete || deleting}
            >
              {deleting ? "Deletando..." : "Deletar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
