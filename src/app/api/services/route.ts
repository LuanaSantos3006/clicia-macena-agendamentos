import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb().collection("services").where("active", "==", true).get();
    const services = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name), "pt-BR"));
    return NextResponse.json(services);
  } catch {
    return NextResponse.json({ error: "Firebase ainda não configurado." }, { status: 503 });
  }
}
