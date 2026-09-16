import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getAdminSession } from "@/lib/auth";
import { ensureDefaultServices } from "@/lib/default-services";
import { z } from "zod";

const serviceSchema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(300).optional(), durationMin: z.coerce.number().int().min(15).max(480), price: z.coerce.number().min(0), active: z.boolean().default(true) });

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const db = adminDb();
  await ensureDefaultServices(db);
  const snapshot = await db.collection("services").get();
  return NextResponse.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: Record<string, unknown>, b: Record<string, unknown>) => String(a.name).localeCompare(String(b.name), "pt-BR")), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const parsed = serviceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os dados do serviço." }, { status: 400 });
  const ref = adminDb().collection("services").doc();
  await ref.set({ name: parsed.data.name, description: parsed.data.description || "", durationMin: parsed.data.durationMin, priceCents: Math.round(parsed.data.price * 100), active: parsed.data.active, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
