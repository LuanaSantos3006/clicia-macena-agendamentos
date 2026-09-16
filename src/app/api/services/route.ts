import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ensureDefaultServices } from "@/lib/default-services";

export async function GET() {
  try {
    const db = adminDb();
    await ensureDefaultServices(db);
    const snapshot = await db.collection("services").where("active", "==", true).get();
    const services = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => String(a.name).localeCompare(String(b.name), "pt-BR"));
    return NextResponse.json(services, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os serviços." }, { status: 503 });
  }
}
