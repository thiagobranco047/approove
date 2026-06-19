import { AppSidebar } from "@/components/app-sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <MobileSidebar />
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
