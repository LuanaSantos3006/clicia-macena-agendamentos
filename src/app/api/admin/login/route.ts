import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { createAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idToken = String(body?.idToken || "");
  if (!idToken) return NextResponse.json({ error: "Autenticação inválida." }, { status: 400 });

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    if (!decoded.email) return NextResponse.json({ error: "Usuário sem e-mail." }, { status: 401 });
    await createAdminSession(decoded.email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível autenticar." }, { status: 401 });
  }
}
