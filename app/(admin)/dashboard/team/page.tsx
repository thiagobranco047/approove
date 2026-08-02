"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Search,
  Users,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Crown,
  UserMinus,
  ArrowUpDown,
} from "lucide-react";

interface MemberData {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

const ROLE_CONFIG: Record<string, { label: string; className: string; icon: typeof Crown }> = {
  owner: {
    label: "Proprietário",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 hover:bg-purple-100",
    icon: Crown,
  },
  admin: {
    label: "Administrador",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100",
    icon: ShieldCheck,
  },
  member: {
    label: "Membro",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100",
    icon: Shield,
  },
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email[0].toUpperCase();
}

export default function TeamPage() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/team");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setMembers(data.members);
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    setError("");
    setInviting(true);

    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao convidar membro");
        return;
      }

      setMembers((prev) => [...prev, data.member]);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
    } catch {
      setError("Erro ao convidar membro");
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao alterar função");
        return;
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch {
      alert("Erro ao alterar função");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const displayName = memberName || "este membro";
    if (!confirm(`Tem certeza que deseja remover ${displayName} da equipe?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao remover membro");
        return;
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      alert("Erro ao remover membro");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      (m.user.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da sua organização
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar novo membro</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo membro da equipe. Se o usuário não
                possuir conta, uma será criada automaticamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome</Label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder="Nome do membro"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Função</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteRole("member")}
                    className={`flex flex-col items-start gap-1 rounded-lg border p-3 transition-colors ${
                      inviteRole === "member"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Membro</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Pode visualizar e interagir com o conteúdo
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole("admin")}
                    className={`flex flex-col items-start gap-1 rounded-lg border p-3 transition-colors ${
                      inviteRole === "admin"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">Administrador</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Pode gerenciar membros e conteúdo
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteOpen(false)}
                disabled={inviting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail || !inviteName || inviting}
              >
                {inviting ? "Convidando..." : "Enviar convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {members.length > 1 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-0">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {search
                ? "Nenhum membro encontrado"
                : "Nenhum membro na equipe"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Tente outro termo de busca"
                : "Comece convidando membros para sua organização"}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Convidar membro
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Membro</span>
              <span className="w-28 text-center">Função</span>
              <span className="w-28 text-center">Desde</span>
              <span className="w-10" />
            </div>
            <Separator />
            {filteredMembers.map((member, index) => {
              const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
              const RoleIcon = roleConfig.icon;

              return (
                <div key={member.id}>
                  {index > 0 && <Separator />}
                  <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <Avatar>
                      <AvatarImage
                        src={member.user.image || undefined}
                        alt={member.user.name || member.user.email}
                      />
                      <AvatarFallback>
                        {getInitials(member.user.name, member.user.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user.name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.user.email}
                      </p>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`${roleConfig.className} gap-1 hidden sm:inline-flex w-28 justify-center`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {roleConfig.label}
                    </Badge>

                    <Badge
                      variant="secondary"
                      className={`${roleConfig.className} gap-1 sm:hidden`}
                    >
                      <RoleIcon className="h-3 w-3" />
                    </Badge>

                    <span className="text-xs text-muted-foreground w-28 text-center hidden sm:block">
                      {new Date(member.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {member.role !== "owner" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === "member" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleChangeRole(member.id, "admin")
                              }
                            >
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              Promover a Administrador
                            </DropdownMenuItem>
                          )}
                          {member.role === "admin" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleChangeRole(member.id, "member")
                              }
                            >
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              Rebaixar a Membro
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              handleRemoveMember(
                                member.id,
                                member.user.name || member.user.email
                              )
                            }
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remover da equipe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!loading && members.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {members.length} {members.length === 1 ? "membro" : "membros"} na
          organização
        </p>
      )}
    </div>
  );
}
