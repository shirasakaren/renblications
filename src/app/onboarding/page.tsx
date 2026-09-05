import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { getPublicConfig } from "@/lib/db";

export const metadata = {
  title: "Set up your publication",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const config = await getPublicConfig();
  if (config.onboarded) redirect("/admin");
  return <OnboardingWizard />;
}
