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
  showStatus?: boolean;
  reviewerName?: string | null;
  allowPendingReset?: boolean;
  viewingLatestPackage?: boolean;
  onShowCurrentVersion?: () => void;
}

export function Header({
  clientName,
  currentStatus,
  onStatusChange,
  onCalendarClick,
  canApprove = true,
  showStatus = true,
  reviewerName,
  allowPendingReset = false,
  viewingLatestPackage = true,
  onShowCurrentVersion,
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
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
      id="app-header"
      data-component="header"
    >
      <div className="min-h-14 sm:h-16 flex items-center justify-between gap-2 px-3 sm:px-6 py-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0" data-section="logo-client">
          <h1 className="hidden sm:block text-2xl font-bold shrink-0">Approove</h1>
          <div className="hidden sm:block h-8 w-px bg-border shrink-0" />
          <div className="min-w-0">
            <p className="text-sm sm:text-lg font-semibold truncate">{clientName}</p>
            {reviewerName && (
              <p className="text-[11px] text-muted-foreground truncate">
                {tr("Revisando como", "Reviewing as")} {reviewerName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0" data-section="actions">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {showStatus &&
            (canApprove ? (
              <div className="flex items-center gap-1">
                {allowPendingReset && (
                  <Button
                    size="sm"
                    variant={currentStatus === "pending" ? "default" : "outline"}
                    className={`hidden md:inline-flex ${currentStatus === "pending" ? getStatusColor("pending") : ""}`}
                    onClick={() => onStatusChange("pending")}
                    data-status="pending"
                    data-action="change-status"
                  >
                    {tr("Pendente", "Pending")}
                  </Button>
                )}
                {viewingLatestPackage ? (
                  <Button
                    size="sm"
                    variant={currentStatus === "approved" ? "default" : "outline"}
                    className={currentStatus === "approved" ? getStatusColor("approved") : ""}
                    onClick={() => onStatusChange("approved")}
                    data-status="approved"
                    data-action="change-status"
                  >
                    {tr("Aprovar", "Approve")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onShowCurrentVersion?.()}
                    data-action="view-current-version"
                  >
                    {tr("Ver versão atual", "View current version")}
                  </Button>
                )}
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
              </div>
            ) : (
              <span className="text-xs text-muted-foreground px-2">
                {tr("Somente visualização", "View only")}
              </span>
            ))}

          <Button
            size="sm"
            variant="outline"
            onClick={onCalendarClick}
            data-action="open-calendar"
            className="px-2 sm:px-3"
          >
            <Calendar className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tr("Calendário", "Calendar")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
