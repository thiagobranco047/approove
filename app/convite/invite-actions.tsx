"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingInvite {
  id: string;
  organizationName: string;
  role: string;
}

export function InviteActions({
  invites,
  labels,
}: {
  invites: PendingInvite[];
  labels: { accept: string; decline: string; admin: string; member: string; error: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const answer = async (id: string, action: "accept" | "decline") => {
    setBusy(`${id}:${action}`);
    setError("");
    try {
      const res = await fetch(`/api/team/invitations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || labels.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {invites.map((invite) => (
        <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <p className="font-medium">{invite.organizationName}</p>
            <p className="text-xs text-muted-foreground">
              {invite.role === "admin" ? labels.admin : labels.member}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => answer(invite.id, "decline")}
            >
              {busy === `${invite.id}:decline` && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {labels.decline}
            </Button>
            <Button size="sm" disabled={busy !== null} onClick={() => answer(invite.id, "accept")}>
              {busy === `${invite.id}:accept` && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {labels.accept}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
