import { cookies } from "next/headers";
import { createHash } from "node:crypto";
export const COOKIE = "admin_token";
export const token = () =>
  createHash("sha256").update("empilhadeira:" + (process.env.ADMIN_PASSWORD || "")).digest("hex");
export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = (await cookies()).get(COOKIE);
  return c?.value === token();
}
