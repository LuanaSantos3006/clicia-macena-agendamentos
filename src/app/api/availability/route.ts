import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

function mins(value: string) { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; }
function clock(value: number) { return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const serviceId = url.searchParams.get("serviceId");
  if (!date || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Informe uma data e um serviço válidos." }, { status: 400 });

  const requestedDay = new Date(`${date}T12:00:00-03:00`);
  const today = new Date();
  const limit = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(requestedDay.getTime()) || requestedDay < new Date(`${today.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}T00:00:00-03:00`) || requestedDay > limit) {
    return NextResponse.json({ error: "Escolha uma data dentro dos próximos 180 dias." }, { status: 400 });
  }

  try {
    const db = adminDb();
    const [serviceSnap, hoursSnap] = await Promise.all([db.collection("services").doc(serviceId).get(), db.collection("settings").doc("workingHours").get()]);
    if (!serviceSnap.exists || serviceSnap.data()?.active !== true) return NextResponse.json([]);
    const duration = Number(serviceSnap.data()?.durationMin || 60);
    const dayIndex = requestedDay.getDay();
    const days = hoursSnap.data()?.days;
    const config = Array.isArray(days) ? days.find((day: { day?: number }) => day.day === dayIndex) : undefined;
    if (!config?.enabled) return NextResponse.json([]);

    const start = mins(config.start), end = mins(config.end);
    const breakStart = config.breakStart ? mins(config.breakStart) : null;
    const breakEnd = config.breakEnd ? mins(config.breakEnd) : null;
    const dayStart = new Date(`${date}T00:00:00-03:00`), dayEnd = new Date(`${date}T23:59:59-03:00`);
    const snapshot = await db.collection("appointments").where("startsAt", ">=", dayStart).where("startsAt", "<=", dayEnd).get();
    const occupied = snapshot.docs.filter(doc => !["CANCELLED", "CANCELED"].includes(String(doc.data().status))).map(doc => ({ start: doc.data().startsAt.toDate().getTime(), end: doc.data().endsAt.toDate().getTime() }));
    const now = Date.now(), slots: string[] = [];
    for (let value = start; value + duration <= end; value += 30) {
      if (breakStart !== null && breakEnd !== null && value < breakEnd && value + duration > breakStart) continue;
      const hour = clock(value), slotStart = new Date(`${date}T${hour}:00-03:00`).getTime(), slotEnd = slotStart + duration * 60000;
      if (slotStart <= now || occupied.some(item => slotStart < item.end && slotEnd > item.start)) continue;
      slots.push(hour);
    }
    return NextResponse.json(slots, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar os horários agora. Tente novamente." }, { status: 500 });
  }
}
