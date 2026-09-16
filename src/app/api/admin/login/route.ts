import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !passwordHash) return NextResponse.json({ error: "Login administrativo ainda não configurado." }, { status: 503 });
  const valid = email === adminEmail && await bcrypt.compare(password, passwordHash);
  if (!valid) return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  await createAdminSession(email);
  return NextResponse.json({ ok: true });
}
