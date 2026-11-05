import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

const TOKEN = "fix-2026-11-06-7f4c9b2e";

export async function POST(request: Request) {
  if (request.headers.get("x-fix-token") !== TOKEN) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = adminDb();
  const batch = db.batch();
  const specialRef = db.collection("settings").doc("specialHours");
  batch.set(specialRef, {
    days: {
      "2026-11-06": { enabled: true, start: "09:00", end: "23:00" },
    },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const appointments = [
    {
      id: "manual-2026-11-06-heloisa-1800",
      clientId: "manual-client-heloisa-11944693587",
      clientName: "Heloísa",
      phone: "11944693587",
      startsAt: new Date("2026-11-06T18:00:00-03:00"),
      endsAt: new Date("2026-11-06T21:00:00-03:00"),
      priceCents: 0,
      notes: "Pacote mensal — 2ª sessão de 4 (mão + pé).",
    },
    {
      id: "manual-2026-11-06-nelson-2000",
      clientId: "manual-client-nelson-11991023697",
      clientName: "Nelson",
      phone: "11991023697",
      startsAt: new Date("2026-11-06T20:00:00-03:00"),
      endsAt: new Date("2026-11-06T23:00:00-03:00"),
      priceCents: 7000,
      notes: "Atendimento avulso — mão + pé.",
    },
  ];

  for (const item of appointments) {
    const clientRef = db.collection("clients").doc(item.clientId);
    batch.set(clientRef, {
      name: item.clientName,
      phone: item.phone,
      source: "MANUAL",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(db.collection("appointments").doc(item.id), {
      clientId: item.clientId,
      clientName: item.clientName,
      phone: item.phone,
      serviceId: "hzuFtoVeZPjrRy7Y7vf5",
      serviceName: "Manicure e pedicure",
      startsAt: Timestamp.fromDate(item.startsAt),
      endsAt: Timestamp.fromDate(item.endsAt),
      priceCents: item.priceCents,
      status: "CONFIRMED",
      paymentMethod: null,
      notes: item.notes,
      source: "MANUAL",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  await batch.commit();
  return NextResponse.json({ ok: true, appointments: appointments.map(item => item.id) });
}
