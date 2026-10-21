import { requireManagerPage } from "@/lib/auth-redirect";

export default async function ManagerOnlyLayout({ children }: { children: React.ReactNode }) {
  await requireManagerPage();
  return children;
}
