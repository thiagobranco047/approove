"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PRODUCTION_STAGES } from "@/lib/production-stages";

export interface TeamMemberOption {
  user: { id: string; name: string | null; email: string };
}

interface PostProductionFieldsProps {
  stage: string;
  assigneeId: string;
  note: string;
  members: TeamMemberOption[];
  onStageChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  idPrefix?: string;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PostProductionFields({
  stage,
  assigneeId,
  note,
  members,
  onStageChange,
  onAssigneeChange,
  onNoteChange,
  idPrefix = "post",
}: PostProductionFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-stage`}>Etapa de produção</Label>
          <select
            id={`${idPrefix}-stage`}
            className={selectClass}
            value={stage}
            onChange={(e) => onStageChange(e.target.value)}
          >
            {PRODUCTION_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-assignee`}>Responsável</Label>
          <select
            id={`${idPrefix}-assignee`}
            className={selectClass}
            value={assigneeId}
            onChange={(e) => onAssigneeChange(e.target.value)}
          >
            <option value="">Sem responsável</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name || m.user.email}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-note`}>Nota para o responsável (opcional)</Label>
        <Input
          id={`${idPrefix}-note`}
          placeholder="Ex.: copy aprovada, seguir com layout do feed"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        />
      </div>
    </div>
  );
}
