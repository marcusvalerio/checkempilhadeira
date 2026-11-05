import { NextResponse } from "next/server";
import { COOKIE, token } from "@/lib/auth";
import { timingSafeEqual } from "node:crypto";

export async function POST(req) {
  const { senha } = await req.json().catch(() => ({}));
  const real = process.env.ADMIN_PASSWORD || "";
  const a = Buffer.from(String(senha || "")), b = Buffer.from(real);
  if (!real || a.length !== b.length || !timingSafeEqual(a, b))
    return NextResponse.json({ erro: "Senha incorreta" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
