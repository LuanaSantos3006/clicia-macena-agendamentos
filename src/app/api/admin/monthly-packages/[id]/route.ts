import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const updateSchema = z.object({
  sessionId: z.enum(["1", "2", "3", "4"]),
  completed: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Atualização inválida." }, { status: 400 });
  const { id } = await params;
  const ref = adminDb().collection("monthlyPackages").doc(id);
  await adminDb().runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("NOT_FOUND");
    const sessions = (snapshot.data()?.sessions || []).map((session: Record<string, unknown>) =>
      session.id === parsed.data.sessionId
        ? { ...session, completed: parsed.data.completed, completedAt: parsed.data.completed ? new Date().toISOString() : null }
        : session
    );
    const status = sessions.length === 4 && sessions.every((session: Record<string, unknown>) => session.completed) ? "COMPLETED" : "ACTIVE";
    transaction.update(ref, { sessions, status, updatedAt: FieldValue.serverTimestamp() });
  }).catch(error => {
    if (error instanceof Error && error.message === "NOT_FOUND") return;
    throw error;
  });
  const current = await ref.get();
  if (!current.exists) return NextResponse.json({ error: "Pacote não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { id } = await params;
  const ref = adminDb().collection("monthlyPackages").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ error: "Pacote não encontrado." }, { status: 404 });
  await ref.delete();
  return NextResponse.json({ ok: true });
}
