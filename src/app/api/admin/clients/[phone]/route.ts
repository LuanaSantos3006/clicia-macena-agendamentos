import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
const schema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().transform(value => value.replace(/\D/g, "")).refine(value => value.length >= 10 && value.length <= 11) });
const clean = (value: string) => value.replace(/\D/g, "");
export async function PUT(request: Request, { params }: { params: Promise<{ phone: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { phone: currentValue } = await params, currentPhone = clean(decodeURIComponent(currentValue)), parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || currentPhone.length < 10) return NextResponse.json({ error: "Confira o nome e o telefone." }, { status: 400 });
  const db = adminDb(), newPhone = parsed.data.phone;
  const [appointments, clients, packages, anamnesis] = await Promise.all([db.collection("appointments").where("phone", "==", currentPhone).get(), db.collection("clients").where("phone", "==", currentPhone).get(), db.collection("monthlyPackages").where("phone", "==", currentPhone).get(), db.collection("clientAnamnesis").doc(currentPhone).get()]);
  const updates: Array<{ ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }> = [];
  appointments.docs.forEach(doc => updates.push({ ref: doc.ref, data: { clientName: parsed.data.name, phone: newPhone, updatedAt: FieldValue.serverTimestamp() } }));
  clients.docs.forEach(doc => updates.push({ ref: doc.ref, data: { name: parsed.data.name, phone: newPhone, updatedAt: FieldValue.serverTimestamp() } }));
  packages.docs.forEach(doc => updates.push({ ref: doc.ref, data: { clientName: parsed.data.name, phone: newPhone, updatedAt: FieldValue.serverTimestamp() } }));
  for (let index = 0; index < updates.length; index += 400) { const batch = db.batch(); updates.slice(index, index + 400).forEach(update => batch.update(update.ref, update.data)); await batch.commit(); }
  if (anamnesis.exists) { const batch = db.batch(); batch.set(db.collection("clientAnamnesis").doc(newPhone), { ...anamnesis.data(), clientName: parsed.data.name, phone: newPhone, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); if (newPhone !== currentPhone) batch.delete(anamnesis.ref); await batch.commit(); }
  return NextResponse.json({ ok: true, name: parsed.data.name, phone: newPhone });
}
