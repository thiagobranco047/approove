import { Check } from "lucide-react";
import { amber, blue, cream, green, ink, paper, purple, sand } from "@/components/landing/tokens";
import { localizedText, type AppLocale } from "@/lib/locale";

export function ProductChrome({
  url = "approove.app/c/cliente-acme",
  children,
}: {
  url?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-3xl border shadow-[0_40px_80px_-40px_rgba(27,25,23,0.4)]"
      style={{ borderColor: "rgba(27,25,23,0.12)", backgroundColor: paper }}
    >
      <div className="flex items-center gap-3 border-b px-5 py-3.5" style={{ borderColor: "rgba(27,25,23,0.08)" }}>
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FF5C38" }} />
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: amber }} />
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: green }} />
        </div>
        <div
          className="flex-1 truncate rounded-full px-4 py-1.5 text-center text-xs font-medium"
          style={{ backgroundColor: "rgba(27,25,23,0.05)", color: "rgba(27,25,23,0.5)" }}
        >
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

export function CreativeCanvas({
  locale,
  versionLabel,
  pinComment,
}: {
  locale: AppLocale;
  versionLabel?: string;
  pinComment?: string;
}) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: `linear-gradient(135deg, ${blue} 0%, ${purple} 100%)` }}
    >
      <div className="aspect-[4/3] sm:aspect-[5/4]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="space-y-2.5 text-center">
          <div className="mx-auto h-3.5 w-40 rounded-full bg-white/35" />
          <div className="mx-auto h-3.5 w-28 rounded-full bg-white/25" />
        </div>
      </div>
      <span
        className="lp-pin-pulse absolute left-[22%] top-[28%] flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold"
        style={{ backgroundColor: cream, color: ink }}
      >
        1
      </span>
      {pinComment && (
        <span
          className="absolute left-[32%] top-[18%] max-w-[14rem] rounded-2xl rounded-bl-md px-3 py-2 text-[11px] font-semibold leading-snug"
          style={{ backgroundColor: cream, color: ink, boxShadow: "0 8px 20px rgba(0,0,0,.18)" }}
        >
          {pinComment}
        </span>
      )}
      {versionLabel && (
        <span
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold"
          style={{ backgroundColor: "rgba(27,25,23,0.75)", color: cream }}
        >
          {versionLabel}
        </span>
      )}
      <span className="sr-only">{tr("Prévia de arte com pin de feedback", "Creative preview with a feedback pin")}</span>
    </div>
  );
}

export function CalendarStrip() {
  const days = [
    { day: "8", color: green },
    { day: "12", color: green },
    { day: "15", color: amber },
    { day: "19", color: "rgba(27,25,23,0.2)" },
    { day: "23", color: "rgba(27,25,23,0.2)" },
  ];

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {days.map(({ day, color }) => (
        <div
          key={day}
          className="flex flex-col items-center gap-1.5 rounded-xl border py-2 text-[10px] font-bold"
          style={{ borderColor: "rgba(27,25,23,0.1)", color: "rgba(27,25,23,0.55)" }}
        >
          {day}
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        </div>
      ))}
    </div>
  );
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto w-full max-w-[280px] rounded-[2.2rem] border-8 p-2 shadow-[0_30px_60px_-30px_rgba(27,25,23,0.45)]"
      style={{ borderColor: ink, backgroundColor: ink }}
    >
      <div className="overflow-hidden rounded-[1.6rem]" style={{ backgroundColor: paper }}>
        {children}
      </div>
    </div>
  );
}

export function ApprovedBadge({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  return (
    <span
      className="inline-flex items-center gap-1.5 self-start rounded-full px-4 py-1.5 text-sm font-bold text-white"
      style={{ backgroundColor: green }}
    >
      <Check className="h-4 w-4" strokeWidth={3} />
      {tr("Aprovado", "Approved")}
    </span>
  );
}

export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "rgba(27,25,23,0.08)", backgroundColor: sand }}>
      {children}
    </div>
  );
}
