"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Trash2,
  Loader2,
  Link2,
  Calendar,
  FileText,
  ImageIcon,
  MessageSquare,
  Users,
  UserRound,
} from "lucide-react";
import { ClientReviewersTab } from "@/components/client-reviewers-tab";
import { PostHandoffDialog } from "@/components/post-handoff-dialog";
import {
  PostMaterialForm,
  createEmptyMaterialDraft,
  isMaterialDraftValid,
  buildAttachmentRequestBody,
  getMaterialDraftLabel,
  type PostMaterialDraft,
} from "@/components/post-material-form";
import { ATTACHMENT_TYPES } from "@/components/post-slide";
import {
  getProductionStageLabel,
  getProductionStageStyle,
} from "@/lib/production-stages";
import { PostProductionFields } from "@/components/post-production-fields";

interface AttachmentVersionData {
  id: string;
  url: string;
  version: number;
}

interface AttachmentData {
  id: string;
  type: string;
  label: string | null;
  order: number;
  versions: AttachmentVersionData[];
}

interface PostData {
  id: string;
  scheduledAt: string;
  channel: string;
  copyText: string;
  status: string;
  productionStage: string;
  assigneeId: string | null;
  handoffNote?: string | null;
  assignee?: { id: string; name: string | null; email: string } | null;
  comments: Array<{ id: string; author: string; text: string; createdAt: string }>;
  attachments?: AttachmentData[];
}

interface TeamMember {
  user: { id: string; name: string | null; email: string };
}

interface VersionData {
  id: string;
  version: string;
  posts: PostData[];
  tokens: Array<{ token: string }>;
}

interface ClientDetail {
  id: string;
  slug: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  versions: VersionData[];
}

const CHANNELS = [
  { value: "Instagram", color: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400" },
  { value: "Facebook", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  { value: "LinkedIn", color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400" },
  { value: "TikTok", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "Twitter/X", color: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300" },
  { value: "YouTube", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: "Pendente", class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  approved: { label: "Aprovado", class: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
  adjustments: { label: "Ajustes", class: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
};

const defaultPostForm = {
  scheduledAt: "",
  channel: "Instagram",
  copyText: "",
};

const defaultProductionForm = {
  productionStage: "draft_copy",
  assigneeId: "",
  handoffNote: "",
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const initialTab = searchParams.get("tab") ?? "posts";

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Post dialog
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState(defaultPostForm);
  const [postSaving, setPostSaving] = useState(false);
  const [materialDraft, setMaterialDraft] = useState<PostMaterialDraft>(createEmptyMaterialDraft);
  const [pendingMaterials, setPendingMaterials] = useState<PostMaterialDraft[]>([]);
  const [productionForm, setProductionForm] = useState(defaultProductionForm);
  const [showMaterialsSection, setShowMaterialsSection] = useState(false);

  // Info edit
  const [infoForm, setInfoForm] = useState({
    name: "", cnpj: "", address: "", website: "", instagram: "", facebook: "", linkedin: "",
  });
  const [infoSaving, setInfoSaving] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [handoffPost, setHandoffPost] = useState<PostData | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (!res.ok) return;
      const data = await res.json();
      setTeamMembers(data.members ?? []);
    } catch {
      // team list is optional for handoff
    }
  }, []);

  const fetchClient = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/clients/${slug}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(
          typeof data.error === "string"
            ? data.error
            : "Cliente não encontrado ou sem permissão de acesso"
        );
        return;
      }
      setClient(data.client);
      setInfoForm({
        name: data.client.name || "",
        cnpj: data.client.cnpj || "",
        address: data.client.address || "",
        website: data.client.website || "",
        instagram: data.client.instagram || "",
        facebook: data.client.facebook || "",
        linkedin: data.client.linkedin || "",
      });
    } catch {
      setLoadError("Erro ao carregar cliente. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchClient();
    fetchTeamMembers();
  }, [fetchClient, fetchTeamMembers]);

  const latestVersion = client?.versions[0];
  const posts = latestVersion?.posts || [];
  const editingPost = editingPostId ? posts.find((p) => p.id === editingPostId) : null;
  const shareToken = latestVersion?.tokens[0]?.token;

  const shareUrl = client && latestVersion && shareToken
    ? `${window.location.origin}/c/${client.slug}/${latestVersion.version}?t=${shareToken}`
    : null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateToken = async () => {
    try {
      const res = await fetch(`/api/clients/${slug}/tokens`, { method: "POST" });
      if (res.ok) fetchClient();
    } catch (error) {
      console.error("Error generating token:", error);
    }
  };

  const openCreatePost = () => {
    setEditingPostId(null);
    setPostForm(defaultPostForm);
    setProductionForm(defaultProductionForm);
    setMaterialDraft(createEmptyMaterialDraft());
    setPendingMaterials([]);
    setShowMaterialsSection(false);
    setPostDialogOpen(true);
  };

  const openEditPost = (post: PostData) => {
    setEditingPostId(post.id);
    const d = new Date(post.scheduledAt);
    const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setPostForm({
      scheduledAt: localISO,
      channel: post.channel,
      copyText: post.copyText,
    });
    setProductionForm({
      productionStage: post.productionStage || "draft_copy",
      assigneeId: post.assigneeId ?? "",
      handoffNote: post.handoffNote ?? "",
    });
    setMaterialDraft(createEmptyMaterialDraft());
    setPendingMaterials([]);
    setShowMaterialsSection(Boolean(post.attachments?.length));
    setPostDialogOpen(true);
  };

  const resetMaterialDraft = () => setMaterialDraft(createEmptyMaterialDraft());

  const addMaterialToQueue = () => {
    if (!isMaterialDraftValid(materialDraft)) return;
    setPendingMaterials((prev) => [...prev, materialDraft]);
    resetMaterialDraft();
  };

  const removePendingMaterial = (index: number) => {
    setPendingMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPostMaterials = async (postId: string, materials: PostMaterialDraft[]) => {
    for (const draft of materials) {
      const body = buildAttachmentRequestBody(draft);
      const res = await fetch(`/api/posts/${postId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Erro ao adicionar material"
        );
      }
    }
  };

  const collectMaterialsForSave = (): PostMaterialDraft[] => {
    const queue = [...pendingMaterials];
    if (isMaterialDraftValid(materialDraft)) {
      queue.push(materialDraft);
    }
    return queue;
  };

  const handleSavePost = async () => {
    if (!client || !latestVersion) return;
    setPostSaving(true);

    try {
      const body = {
        scheduledAt: postForm.scheduledAt,
        channel: postForm.channel,
        copyText: postForm.copyText,
        productionStage: productionForm.productionStage,
        assigneeId: productionForm.assigneeId || null,
        handoffNote: productionForm.handoffNote.trim() || undefined,
      };
      const materials = collectMaterialsForSave();
      let postId = editingPostId;

      if (editingPostId) {
        const res = await fetch(`/api/posts/${editingPostId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data.error === "string" ? data.error : "Erro ao salvar publicação"
          );
        }
      } else {
        const res = await fetch(`/api/calendar/${client.slug}/${latestVersion.version}/posts/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data.error === "string" ? data.error : "Erro ao criar publicação"
          );
        }
        const data = await res.json();
        postId = data.post?.id;
        if (!postId) throw new Error("Publicação criada sem identificador");
      }

      if (materials.length > 0 && postId) {
        await uploadPostMaterials(postId, materials);
      }

      setPostDialogOpen(false);
      resetMaterialDraft();
      setPendingMaterials([]);
      setProductionForm(defaultProductionForm);
      setShowMaterialsSection(false);
      fetchClient();
    } catch (error) {
      console.error("Error saving post:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar publicação");
    } finally {
      setPostSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta publicação?")) return;
    try {
      await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      fetchClient();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleSaveInfo = async () => {
    setInfoSaving(true);
    try {
      await fetch(`/api/clients/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infoForm),
      });
      fetchClient();
    } catch (error) {
      console.error("Error saving info:", error);
    } finally {
      setInfoSaving(false);
    }
  };

  const getChannelStyle = (channel: string) =>
    CHANNELS.find((c) => c.value === channel)?.color || "bg-muted text-muted-foreground";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // Group posts by date
  const postsByDate = posts.reduce<Record<string, PostData[]>>((acc, post) => {
    const dateKey = new Date(post.scheduledAt).toISOString().split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(post);
    return acc;
  }, {});

  // Calendar data
  const calendarDates = new Set(Object.keys(postsByDate));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Cliente</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">
              {loadError ?? "Cliente não encontrado."}
            </p>
            <p className="text-sm text-muted-foreground">
              A gestão interna (publicações, revisores, informações) fica em{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/dashboard/clients/demo-client</code>
              {" "}— não confunda com a visão do calendário em{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/c/demo-client/v1</code>.
            </p>
            <Button onClick={() => router.push("/dashboard/clients")}>
              Voltar para clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: posts.length,
    approved: posts.filter((p) => p.status === "approved").length,
    pending: posts.filter((p) => p.status === "pending").length,
    adjustments: posts.filter((p) => p.status === "adjustments").length,
  };

  const calendarHref = `/c/${client.slug}/${latestVersion?.version ?? "v1"}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">/{client.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {shareUrl ? (
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleGenerateToken}>
              <Link2 className="h-4 w-4 mr-2" />
              Gerar link
            </Button>
          )}

          <Button variant="default" size="sm" asChild>
            <a href={calendarHref} target="_blank" rel="noopener noreferrer">
              <ImageIcon className="h-4 w-4 mr-2" />
              Montar calendário e artes
            </a>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <a
              href={`${calendarHref}${shareToken ? `?t=${shareToken}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visão do cliente
            </a>
          </Button>

          <Button size="sm" onClick={openCreatePost}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Publicação
          </Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="space-y-1">
            <p className="font-medium">Calendário de produção</p>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Nesta página você gerencia publicações (data, canal e copy), revisores e informações do cliente.
              Para <strong>enviar artes</strong>, criar pins, comentar e aprovar, abra o calendário de produção — é lá que o time monta o conteúdo visual.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <a href={calendarHref} target="_blank" rel="noopener noreferrer">
              Montar calendário e artes
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.adjustments}</p>
            <p className="text-xs text-muted-foreground">Ajustes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" /> Publicações
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="gap-2">
            <Users className="h-4 w-4" /> Revisores
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <Pencil className="h-4 w-4" /> Informações
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4 space-y-6">
          {posts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Planeje o calendário com data e copy — as artes podem ser adicionadas depois no calendário de produção ou ao editar a publicação.
            </p>
          )}
          {posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma publicação</p>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
                  Comece registrando data e texto — ideal para planejar o mês. As imagens entram depois.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <Button onClick={openCreatePost}>
                    <Plus className="h-4 w-4 mr-2" /> Nova Publicação
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={calendarHref} target="_blank" rel="noopener noreferrer">
                      <ImageIcon className="h-4 w-4 mr-2" /> Montar calendário e artes
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(postsByDate).map(([dateKey, dayPosts]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {formatDate(dayPosts[0].scheduledAt)}
                </h3>
                <div className="space-y-3">
                  {dayPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {!post.attachments?.length && (
                            <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {post.attachments?.[0]?.versions?.[0]?.url && (
                            <img
                              src={post.attachments[0].versions[post.attachments[0].versions.length - 1].url}
                              alt=""
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="secondary" className={getChannelStyle(post.channel)}>
                                {post.channel}
                              </Badge>
                              <Badge variant="secondary" className={STATUS_MAP[post.status]?.class}>
                                {STATUS_MAP[post.status]?.label}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={getProductionStageStyle(post.productionStage)}
                              >
                                {getProductionStageLabel(post.productionStage)}
                              </Badge>
                              {post.assignee && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <UserRound className="h-3 w-3" />
                                  {post.assignee.name || post.assignee.email}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(post.scheduledAt)}
                              </span>
                              {post.comments.length > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {post.comments.length}
                                </span>
                              )}
                            </div>
                            <p className="text-sm line-clamp-2">{post.copyText}</p>
                          </div>
                          <div className="flex items-start gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => setHandoffPost(post)}
                            >
                              Delegar
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPost(post)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <SimpleCalendar
                dates={calendarDates}
                posts={postsByDate}
                onDateClick={(dateKey) => {
                  const dayPosts = postsByDate[dateKey];
                  if (dayPosts?.length === 1) openEditPost(dayPosts[0]);
                }}
                onEmptyDateClick={(dateKey) => {
                  setEditingPostId(null);
                  setPostForm({
                    ...defaultPostForm,
                    scheduledAt: `${dateKey}T10:00`,
                  });
                  setPostDialogOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviewers Tab */}
        <TabsContent value="reviewers">
          {latestVersion ? (
            <ClientReviewersTab
              clientSlug={client.slug}
              clientId={client.id}
              clientName={client.name}
              calendarVersionId={latestVersion.id}
              calendarVersionLabel={latestVersion.version}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Crie uma versão de calendário antes de convidar revisores.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={infoForm.name} onChange={(e) => setInfoForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={infoForm.cnpj} onChange={(e) => setInfoForm((p) => ({ ...p, cnpj: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={infoForm.address} onChange={(e) => setInfoForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={infoForm.website} onChange={(e) => setInfoForm((p) => ({ ...p, website: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input value={infoForm.instagram} onChange={(e) => setInfoForm((p) => ({ ...p, instagram: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input value={infoForm.facebook} onChange={(e) => setInfoForm((p) => ({ ...p, facebook: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input value={infoForm.linkedin} onChange={(e) => setInfoForm((p) => ({ ...p, linkedin: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleSaveInfo} disabled={infoSaving}>
                {infoSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Create/Edit Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>{editingPostId ? "Editar Publicação" : "Nova Publicação"}</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Registre data e copy para planejar o calendário. Artes e materiais visuais são opcionais e podem ser adicionados depois.
            </p>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 space-y-5 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data e hora</Label>
                <Input
                  type="datetime-local"
                  value={postForm.scheduledAt}
                  onChange={(e) => setPostForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <select
                  value={postForm.channel}
                  onChange={(e) => setPostForm((p) => ({ ...p, channel: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch.value} value={ch.value}>{ch.value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Texto da publicação</Label>
              <textarea
                value={postForm.copyText}
                onChange={(e) => setPostForm((p) => ({ ...p, copyText: e.target.value }))}
                rows={5}
                placeholder="Escreva o texto da publicação para esta data..."
                className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Salve só o texto para ir montando o planejamento editorial — sem obrigatoriedade de anexar imagens agora.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div>
                <p className="text-sm font-medium">Produção e responsável</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Defina a etapa e transfira a tarefa para alguém do time.
                </p>
              </div>
              <PostProductionFields
                stage={productionForm.productionStage}
                assigneeId={productionForm.assigneeId}
                note={productionForm.handoffNote}
                members={teamMembers}
                onStageChange={(value) =>
                  setProductionForm((p) => ({ ...p, productionStage: value }))
                }
                onAssigneeChange={(value) =>
                  setProductionForm((p) => ({ ...p, assigneeId: value }))
                }
                onNoteChange={(value) =>
                  setProductionForm((p) => ({ ...p, handoffNote: value }))
                }
                idPrefix="post-dialog"
              />
            </div>

            {editingPost?.attachments && editingPost.attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Materiais já anexados</Label>
                <div className="flex flex-wrap gap-2">
                  {editingPost.attachments.map((att) => {
                    const cover = att.versions[att.versions.length - 1]?.url;
                    const label = att.label || ATTACHMENT_TYPES[att.type] || att.type;
                    return (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-lg border px-2 py-1.5 bg-muted/30 text-sm"
                      >
                        {cover ? (
                          <img src={cover} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground p-1" />
                        )}
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Novos materiais abaixo serão adicionados à publicação ao salvar.
                </p>
              </div>
            )}

            <div className="rounded-lg border">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setShowMaterialsSection((v) => !v)}
              >
                <div>
                  <p className="text-sm font-medium">Materiais visuais (opcional)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload, URL, carrossel ou vídeo — pode ficar para depois do planejamento.
                  </p>
                </div>
                {showMaterialsSection ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {showMaterialsSection && (
                <div className="space-y-3 border-t p-4">
              <PostMaterialForm draft={materialDraft} onChange={setMaterialDraft} dense />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addMaterialToQueue}
                disabled={!isMaterialDraftValid(materialDraft)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar material à publicação
              </Button>

              {pendingMaterials.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {pendingMaterials.length} material(is) na fila
                  </p>
                  <div className="space-y-2">
                    {pendingMaterials.map((draft, index) => {
                      const previewUrl =
                        draft.type === "carousel"
                          ? draft.slides.find((s) => s.url.trim())?.url
                          : draft.url;
                      return (
                        <div
                          key={`${index}-${getMaterialDraftLabel(draft)}`}
                          className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {previewUrl ? (
                              <img src={previewUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                            ) : (
                              <ImageIcon className="w-10 h-10 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{getMaterialDraftLabel(draft)}</p>
                              {draft.type === "carousel" && (
                                <p className="text-xs text-muted-foreground">
                                  {draft.slides.filter((s) => s.url.trim()).length} slides
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive"
                            onClick={() => removePendingMaterial(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t px-6 py-4 flex gap-3 bg-background">
            <Button variant="outline" onClick={() => setPostDialogOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSavePost}
              disabled={postSaving || !postForm.scheduledAt}
              className="flex-1"
            >
              {postSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : editingPostId ? "Salvar alterações" : "Criar Publicação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {handoffPost && (
        <PostHandoffDialog
          open={Boolean(handoffPost)}
          onOpenChange={(open) => !open && setHandoffPost(null)}
          postId={handoffPost.id}
          initialStage={handoffPost.productionStage || "draft_copy"}
          initialAssigneeId={handoffPost.assigneeId}
          members={teamMembers}
          onSuccess={fetchClient}
        />
      )}
    </div>
  );
}
function SimpleCalendar({
  dates,
  posts,
  onDateClick,
  onEmptyDateClick,
}: {
  dates: Set<string>;
  posts: Record<string, PostData[]>;
  onDateClick: (dateKey: string) => void;
  onEmptyDateClick: (dateKey: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const goToToday = () => setCurrentMonth(new Date());
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const prevYear = () => setCurrentMonth(new Date(year - 1, month, 1));
  const nextYear = () => setCurrentMonth(new Date(year + 1, month, 1));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const todayKey = new Date().toISOString().split("T")[0];
  const isCurrentViewToday =
    new Date().getFullYear() === year && new Date().getMonth() === month;

  // Count posts in this month
  const monthPostCount = days.reduce<number>((count, day) => {
    if (!day) return count;
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return count + (posts[dateKey]?.length || 0);
  }, 0);

  return (
    <div>
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevYear} title="Ano anterior">
            &laquo;
          </Button>
          <Button variant="ghost" size="sm" onClick={prevMonth} title="Mês anterior">
            &lsaquo;
          </Button>
        </div>

        <div className="text-center">
          <h3 className="font-medium capitalize">{monthName}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            {monthPostCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {monthPostCount} {monthPostCount === 1 ? "publicação" : "publicações"}
              </span>
            )}
            {!isCurrentViewToday && (
              <button
                onClick={goToToday}
                className="text-xs text-primary hover:underline"
              >
                Hoje
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={nextMonth} title="Próximo mês">
            &rsaquo;
          </Button>
          <Button variant="ghost" size="sm" onClick={nextYear} title="Próximo ano">
            &raquo;
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div
            key={d}
            className="text-xs font-medium text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}

        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasPosts = dates.has(dateKey);
          const dayPosts = posts[dateKey];
          const isToday = dateKey === todayKey;

          return (
            <button
              key={dateKey}
              onClick={() =>
                hasPosts ? onDateClick(dateKey) : onEmptyDateClick(dateKey)
              }
              className={`
                relative p-2 rounded-lg text-sm transition-colors cursor-pointer
                ${isToday ? "ring-2 ring-primary" : ""}
                ${hasPosts
                  ? "bg-primary/10 hover:bg-primary/20 font-medium"
                  : "hover:bg-muted text-muted-foreground"
                }
              `}
              title={
                hasPosts
                  ? `${dayPosts!.length} publicação(ões)`
                  : "Clique para criar publicação"
              }
            >
              {day}
              {hasPosts && dayPosts && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.status === "approved"
                          ? "bg-green-500"
                          : p.status === "adjustments"
                            ? "bg-orange-500"
                            : "bg-gray-400"
                      }`}
                    />
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[8px] text-muted-foreground ml-0.5">
                      +{dayPosts.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

