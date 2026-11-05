import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const schema = z.object({
  clientName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  month: z.string().regex(monthPattern),
  amount: z.union([z.string(), z.number()]),
  paymentMethod: z.enum(["CASH", "PIX", "CARD", "PENDING"]),
  notes: z.string().trim().max(200).optional().default(""),
});

const sessionTemplate = [
  { id: "1", label: "Sessão 1", manicure: 1, pedicure: 1, completed: false, completedAt: null },
  { id: "2", label: "Sessão 2", manicure: 1, pedicure: 0, completed: false, completedAt: null },
  { id: "3", label: "Sessão 3", manicure: 1, pedicure: 1, completed: false, completedAt: null },
  { id: "4", label: "Sessão 4", manicure: 1, pedicure: 0, completed: false, completedAt: null },
];

function amountInCents(value: string | number) {
  const normalized = String(value).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

export async function GET(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const month = new URL(request.url).searchParams.get("month") || "";
  if (!monthPattern.test(month)) return NextResponse.json({ error: "Mês inválido." }, { status: 400 });
  const snapshot = await adminDb().collection("monthlyPackages").where("month", "==", month).get();
  const packages = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => String(a.clientName).localeCompare(String(b.clientName), "pt-BR"));
  return NextResponse.json(packages, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os dados do pacote." }, { status: 400 });
  const amountCents = amountInCents(parsed.data.amount);
  if (amountCents < 0 || amountCents > 10000000) return NextResponse.json({ error: "Informe um valor válido." }, { status: 400 });
  const ref = adminDb().collection("monthlyPackages").doc();
  await ref.set({
    clientName: parsed.data.clientName,
    phone: parsed.data.phone,
    month: parsed.data.month,
    amountCents,
    paymentMethod: parsed.data.paymentMethod,
    notes: parsed.data.notes,
    sessions: sessionTemplate,
    status: "ACTIVE",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
