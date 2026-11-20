import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { decryptRefreshToken, googleCalendarConfig, googleCalendarConnection, refreshGoogleAccessToken } from "@/lib/google-calendar";

type GoogleEvent = { id?: string; status?: string; summary?: string; description?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } };

export async function POST() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const config = googleCalendarConfig();
  const connection = await googleCalendarConnection();
  if (!config.clientId || !config.clientSecret || !config.encryptionKey) return NextResponse.json({ error: "A integração do Google ainda não foi configurada." }, { status: 503 });
  if (!connection?.encryptedRefreshToken) return NextResponse.json({ error: "Conecte primeiro a conta Google Calendar." }, { status: 409 });
  try {
    const accessToken = await refreshGoogleAccessToken(decryptRefreshToken(connection.encryptedRefreshToken));
    const timeMin = new Date(Date.now() - 7 * 86400000).toISOString();
    const timeMax = new Date(Date.now() + 365 * 86400000).toISOString();
    let pageToken = "", imported = 0, skipped = 0;
    const db = adminDb();
    do {
      const params = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", showDeleted: "true", maxResults: "250", orderBy: "startTime" });
      if (pageToken) params.set("pageToken", pageToken);
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const payload = await response.json() as { items?: GoogleEvent[]; nextPageToken?: string; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "Falha ao consultar a agenda Google.");
      const batch = db.batch();
      for (const event of payload.items || []) {
        if (!event.id) { skipped++; continue; }
        const starts = event.start?.dateTime, ends = event.end?.dateTime;
        if (!starts || !ends) { skipped++; continue; }
        const startsAt = new Date(starts), endsAt = new Date(ends);
        if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) { skipped++; continue; }
        const ref = db.collection("appointments").doc(`gcal_${Buffer.from(event.id).toString("base64url")}`);
        const previous = await ref.get();
        const old = previous.data() || {};
        const title = (event.summary || "").trim() || "Agendamento Google Calendar";
        batch.set(ref, {
          clientName: old.clientName || title,
          phone: old.phone || "",
          serviceName: old.serviceName || title,
          startsAt: Timestamp.fromDate(startsAt),
          endsAt: Timestamp.fromDate(endsAt),
          priceCents: Number(old.priceCents || 0),
          status: event.status === "cancelled" ? "CANCELLED" : (old.status === "CANCELLED" ? "PENDING" : old.status || "PENDING"),
          notes: old.notes || (event.description || "").slice(0, 500) || null,
          paymentMethod: old.paymentMethod || null,
          paymentReceived: Boolean(old.paymentReceived),
          source: "GOOGLE_CALENDAR",
          googleEventId: event.id,
          googleCalendarId: "primary",
          isPackage: Boolean(old.isPackage),
          createdAt: old.createdAt || FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        imported++;
      }
      await batch.commit();
      pageToken = payload.nextPageToken || "";
    } while (pageToken);
    await db.collection("settings").doc("googleCalendarConnection").set({ lastSyncedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ ok: true, imported, skipped });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível sincronizar a agenda." }, { status: 502 });
  }
}
