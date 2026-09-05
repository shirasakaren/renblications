import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSession } from "./db";
import { hashToken } from "./security";

export const ADMIN_COOKIE = "ren_publications_admin";

export async function isAdminRequest(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return hasSession(hashToken(token));
}

export async function requireAdminPage(): Promise<void> {
  if (!(await isAdminRequest())) redirect("/admin/login");
}
