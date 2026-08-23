"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyDaySlideProps {
  date: Date;
  isAdmin: boolean;
  onAddPost?: () => void;
}

export function EmptyDaySlide({ date, isAdmin, onAddPost }: EmptyDaySlideProps) {
  const dateLabel = format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });

  return (
    <div className="h-screen w-full flex flex-col pt-16" data-component="empty-day-slide">
      <div className="border-b bg-background/95 px-6 py-3">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{dateLabel}</span>
          </div>
          {isAdmin && onAddPost && (
            <div className="flex gap-2 ml-4 pl-4 border-l">
              <Button size="sm" variant="outline" onClick={onAddPost}>
                <Plus className="h-4 w-4 mr-1" /> Novo post
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Nenhuma publicação neste dia</p>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Clique em “+ Novo post” para criar uma publicação nesta data."
                : "Ainda não há conteúdo para revisar neste dia."}
            </p>
          </div>
          {isAdmin && onAddPost && (
            <Button onClick={onAddPost} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Novo post
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
