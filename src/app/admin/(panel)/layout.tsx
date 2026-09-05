import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth";
import { getPublicConfig } from "@/lib/db";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const config = await getPublicConfig();
  return (
    <AdminShell siteName={config.site.name} shortName={config.site.shortName} authorName={config.profile.name}>
      {children}
    </AdminShell>
  );
}
