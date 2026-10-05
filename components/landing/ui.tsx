import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.25em]"
      style={{ color: light ? "rgba(244,233,225,0.55)" : "rgba(27,25,23,0.5)" }}
    >
      {children}
    </p>
  );
}

export function PillLink({
  href,
  children,
  variant = "solid",
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  light?: boolean;
}) {
  const base =
    "group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-tight transition-colors duration-300";
  const styles =
    variant === "solid"
      ? light
        ? "bg-[#F4E9E1] text-[#1B1917] hover:bg-[#0072E3] hover:text-white"
        : "bg-[#1B1917] text-[#F4E9E1] hover:bg-[#0072E3] hover:text-white"
      : light
        ? "border-[1.5px] border-[#F4E9E1]/40 text-[#F4E9E1] hover:border-[#F4E9E1] hover:bg-[#F4E9E1] hover:text-[#1B1917]"
        : "border-[1.5px] border-[#1B1917]/30 text-[#1B1917] hover:border-[#1B1917] hover:bg-[#1B1917] hover:text-[#F4E9E1]";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-extrabold tracking-tight ${className}`}>
      approove
      <span className="ml-0.5 inline-block h-[0.5em] w-[0.5em] rounded-full bg-[#0072E3]" />
    </span>
  );
}

export function TrialNote({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className="text-sm font-medium"
      style={{ color: light ? "rgba(244,233,225,0.5)" : "rgba(27,25,23,0.45)" }}
    >
      {children}
    </p>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 max-w-3xl text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
      {children}
    </h2>
  );
}
