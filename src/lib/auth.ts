import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "./constants";
import { hasSession } from "./db";
import { hashToken } from "./security";

export async function isAdminRequest(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return hasSession(hashToken(token));
}

export async function requireAdminPage(): Promise<void> {
  if (!(await isAdminRequest())) redirect("/admin/login");
}
