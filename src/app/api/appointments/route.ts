import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().transform(value => value.replace(/\D/g, "")).refine(value => value.length >= 10 && value.length <= 11),
  serviceId: z.string().min(1),
  startsAt: z.string().datetime(),
  notes: z.string().trim().max(500).optional(),
});

function mins(value: string) { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; }

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira seu nome e WhatsApp antes de continuar." }, { status: 400 });
  try {
    const db = adminDb();
    const result = await db.runTransaction(async transaction => {
      const serviceRef = db.collection("services").doc(parsed.data.serviceId);
      const serviceSnap = await transaction.get(serviceRef);
      if (!serviceSnap.exists || serviceSnap.data()?.active !== true) throw new Error("SERVICE");
      const service = serviceSnap.data()!;
      const startsAt = new Date(parsed.data.startsAt);
      if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now() || startsAt.getTime() > Date.now() + 180 * 24 * 60 * 60 * 1000) throw new Error("TIME");
      const duration = Number(service.durationMin || 60), endsAt = new Date(startsAt.getTime() + duration * 60000);
      const brDate = new Date(startsAt.getTime() - 3 * 3600000), date = brDate.toISOString().slice(0, 10), hour = brDate.toISOString().slice(11, 16);
      const dayIndex = new Date(`${date}T12:00:00-03:00`).getDay();
      const hoursRef = db.collection("settings").doc("workingHours"), hoursSnap = await transaction.get(hoursRef);
      const days = hoursSnap.data()?.days;
      const config = Array.isArray(days) ? days.find((day: { day?: number }) => day.day === dayIndex) : undefined;
      if (!config?.enabled) throw new Error("TIME");
      const startMinutes = mins(hour), endMinutes = startMinutes + duration;
      if (startMinutes < mins(config.start) || endMinutes > mins(config.end)) throw new Error("TIME");
      if (config.breakStart && config.breakEnd && startMinutes < mins(config.breakEnd) && endMinutes > mins(config.breakStart)) throw new Error("TIME");

      const dayStart = new Date(`${date}T00:00:00-03:00`), dayEnd = new Date(`${date}T23:59:59-03:00`);
      const existing = await transaction.get(db.collection("appointments").where("startsAt", ">=", dayStart).where("startsAt", "<=", dayEnd));
      if (existing.docs.some(doc => !["CANCELLED", "CANCELED"].includes(String(doc.data().status)) && startsAt.getTime() < doc.data().endsAt.toDate().getTime() && endsAt.getTime() > doc.data().startsAt.toDate().getTime())) throw new Error("CONFLICT");
      const slotRef = db.collection("appointmentSlots").doc(startsAt.toISOString().replace(/[^0-9]/g, "").slice(0, 14));
      if ((await transaction.get(slotRef)).exists) throw new Error("CONFLICT");

      const clientRef = db.collection("clients").doc(), appointmentRef = db.collection("appointments").doc();
      transaction.create(slotRef, { appointmentId: appointmentRef.id, startsAt: Timestamp.fromDate(startsAt), endsAt: Timestamp.fromDate(endsAt), createdAt: FieldValue.serverTimestamp() });
      transaction.create(clientRef, { name: parsed.data.name, phone: parsed.data.phone, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      transaction.create(appointmentRef, { clientId: clientRef.id, clientName: parsed.data.name, phone: parsed.data.phone, serviceId: serviceRef.id, serviceName: service.name, startsAt: Timestamp.fromDate(startsAt), endsAt: Timestamp.fromDate(endsAt), priceCents: Number(service.priceCents || 0), status: "PENDING", notes: parsed.data.notes || null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return { id: appointmentRef.id, status: "PENDING", service: String(service.name), startsAt: startsAt.toISOString(), priceCents: Number(service.priceCents || 0) };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "CONFLICT") return NextResponse.json({ error: "Este horário acabou de ser reservado. Escolha outro horário disponível." }, { status: 409 });
    if (error instanceof Error && error.message === "SERVICE") return NextResponse.json({ error: "Este serviço não está disponível no momento." }, { status: 400 });
    if (error instanceof Error && error.message === "TIME") return NextResponse.json({ error: "Escolha um horário válido dentro do expediente." }, { status: 400 });
    return NextResponse.json({ error: "Não foi possível registrar o agendamento agora. Tente novamente." }, { status: 500 });
  }
}
