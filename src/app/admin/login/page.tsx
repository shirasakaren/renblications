import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/admin-login";
import { isAdminRequest } from "@/lib/auth";
import { getPublicConfig } from "@/lib/db";

export default async function AdminLoginPage() {
  const [config, authenticated] = await Promise.all([getPublicConfig(), isAdminRequest()]);
  if (!config.onboarded) redirect("/onboarding");
  if (authenticated) redirect("/admin");
  return <AdminLogin siteName={config.site.name} shortName={config.site.shortName} />;
}
