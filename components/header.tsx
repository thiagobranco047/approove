"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import type { PostStatus } from "./post-slide";
import { useLocale } from "@/components/locale-provider";
import { localizedText } from "@/lib/locale";

interface HeaderProps {
  clientName: string;
  currentStatus: PostStatus;
  onStatusChange: (status: PostStatus) => void;
  onCalendarClick?: () => void;
  canApprove?: boolean;
  reviewerName?: string | null;
}

export function Header({
  clientName,
  currentStatus,
  onStatusChange,
  onCalendarClick,
  canApprove = true,
  reviewerName,
}: HeaderProps) {
  const locale = useLocale();
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-500 hover:bg-green-600";
      case "adjustments":
        return "bg-orange-500 hover:bg-orange-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b" id="app-header" data-component="header">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Logo + Client Name */}
        <div className="flex items-center gap-4" data-section="logo-client">
          <h1 className="text-2xl font-bold">Approove</h1>
          <div className="h-8 w-px bg-border"></div>
          <p className="text-lg font-semibold">{clientName}</p>
          {reviewerName && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              {tr("Revisando como", "Reviewing as")} {reviewerName}
            </p>
          )}
        </div>

        {/* Theme Toggle + Status Buttons + Calendar */}
        <div className="flex items-center gap-2" data-section="actions">
          <ThemeToggle />
          
          <div className="w-px h-8 bg-border mx-2"></div>

          {canApprove ? (
          <>
          <Button
            size="sm"
            variant={currentStatus === "pending" ? "default" : "outline"}
            className={currentStatus === "pending" ? getStatusColor("pending") : ""}
            onClick={() => onStatusChange("pending")}
            data-status="pending"
            data-action="change-status"
          >
            {tr("Pendente", "Pending")}
          </Button>
          <Button
            size="sm"
            variant={currentStatus === "approved" ? "default" : "outline"}
            className={currentStatus === "approved" ? getStatusColor("approved") : ""}
            onClick={() => onStatusChange("approved")}
            data-status="approved"
            data-action="change-status"
          >
            {tr("Aprovado", "Approved")}
          </Button>
          <Button
            size="sm"
            variant={currentStatus === "adjustments" ? "default" : "outline"}
            className={
              currentStatus === "adjustments" ? getStatusColor("adjustments") : ""
            }
            onClick={() => onStatusChange("adjustments")}
            data-status="adjustments"
            data-action="change-status"
          >
            {tr("Ajustes", "Changes")}
          </Button>
          </>
          ) : (
            <span className="text-xs text-muted-foreground px-2">{tr("Somente visualização", "View only")}</span>
          )}

          {/* Calendar Button with left margin */}
          <div className="ml-4 pl-4 border-l">
            <Button
              size="sm"
              variant="outline"
              onClick={onCalendarClick}
              data-action="open-calendar"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {tr("Calendário", "Calendar")}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
