import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { decryptRefreshToken, googleCalendarConfig, googleCalendarConnection, refreshGoogleAccessToken } from "@/lib/google-calendar";

type GoogleEvent = { id?: string; status?: string; summary?: string; description?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } };
type GoogleEventsResponse = { items?: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string; error?: { message?: string } };

async function syncCalendar(request: Request) {
  const isAdmin = Boolean(await getAdminSession());
  const cronSecret = process.env.CRON_SECRET || "";
  const isCron = Boolean(cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`);
  if (!isAdmin && !isCron) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const config = googleCalendarConfig();
  const connection = await googleCalendarConnection();
  if (!config.clientId || !config.clientSecret || !config.encryptionKey) return NextResponse.json({ error: "A integração do Google ainda não foi configurada." }, { status: 503 });
  if (!connection?.encryptedRefreshToken) return NextResponse.json({ error: "Conecte primeiro a conta Google Calendar." }, { status: 409 });

  try {
    const accessToken = await refreshGoogleAccessToken(decryptRefreshToken(connection.encryptedRefreshToken));
    const db = adminDb();
    const serviceDocs = await db.collection("services").where("active", "==", true).get();
    const services = serviceDocs.docs.map(doc => ({ name: String(doc.data().name || ""), priceCents: Number(doc.data().priceCents || 0) })).filter(service => service.name);
    let syncToken = typeof connection.syncToken === "string" ? connection.syncToken : "";
    let incremental = Boolean(syncToken);
    let pageToken: string | undefined;
    let nextSyncToken: string | undefined;
    let imported = 0, skipped = 0;

    while (true) {
      const params = new URLSearchParams({ singleEvents: "true", showDeleted: "true", maxResults: "250" });
      if (incremental && syncToken) {
        params.set("syncToken", syncToken);
      } else {
        params.set("timeMin", new Date(Date.now() - 7 * 86400000).toISOString());
        params.set("timeMax", new Date(Date.now() + 365 * 86400000).toISOString());
        params.set("orderBy", "startTime");
      }
      if (pageToken) params.set("pageToken", pageToken);
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const payload = await response.json() as GoogleEventsResponse;
      if (response.status === 410 && incremental) {
        // Google sync tokens expire periodically. Rebuild the baseline once, then save a fresh token.
        syncToken = "";
        incremental = false;
        pageToken = undefined;
        nextSyncToken = undefined;
        imported = 0;
        skipped = 0;
        continue;
      }
      if (!response.ok) throw new Error(payload.error?.message || "Falha ao consultar a agenda Google.");

      const batch = db.batch();
      for (const event of payload.items || []) {
        if (!event.id) { skipped++; continue; }
        const ref = db.collection("appointments").doc("gcal_" + Buffer.from(event.id).toString("base64url"));
        const previous = await ref.get();
        const old = previous.data() || {};
        const starts = event.start?.dateTime, ends = event.end?.dateTime;
        if (!starts || !ends) {
          if (event.status === "cancelled" && previous.exists) {
            batch.update(ref, { status: "CANCELLED", updatedAt: FieldValue.serverTimestamp() });
            imported++;
          } else skipped++;
          continue;
        }
        const startsAt = new Date(starts), endsAt = new Date(ends);
        if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) { skipped++; continue; }
        const title = (event.summary || "").trim() || "Agendamento Google Calendar";
        const normalizedTitle = title.toLocaleLowerCase("pt-BR");
        const matchedService = services.find(service => normalizedTitle.includes(service.name.toLocaleLowerCase("pt-BR")));
        const serviceName = old.serviceName || matchedService?.name || title;
        let importedClientName = title;
        if (matchedService) {
          const index = normalizedTitle.indexOf(matchedService.name.toLocaleLowerCase("pt-BR"));
          importedClientName = (title.slice(0, index) + " " + title.slice(index + matchedService.name.length)).replace(/[|–—,:;()\\s-]+/g, " ").trim();
        }
        batch.set(ref, {
          clientName: old.clientName || importedClientName || title,
          phone: old.phone || "",
          serviceName,
          startsAt: Timestamp.fromDate(startsAt),
          endsAt: Timestamp.fromDate(endsAt),
          priceCents: Number(old.priceCents || matchedService?.priceCents || 0),
          status: event.status === "cancelled" ? "CANCELLED" : (old.status || "PENDING"),
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
      if (payload.nextPageToken) {
        pageToken = payload.nextPageToken;
        continue;
      }
      nextSyncToken = payload.nextSyncToken;
      break;
    }

    const connectionUpdate: Record<string, unknown> = { lastSyncedAt: FieldValue.serverTimestamp() };
    if (nextSyncToken) connectionUpdate.syncToken = nextSyncToken;
    await db.collection("settings").doc("googleCalendarConnection").set(connectionUpdate, { merge: true });
    return NextResponse.json({ ok: true, imported, skipped });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível sincronizar a agenda." }, { status: 502 });
  }
}

// Manual sync from the admin screen.
export async function POST(request: Request) {
  return syncCalendar(request);
}

// Vercel Cron invokes GET every 15 minutes in production.
export async function GET(request: Request) {
  return syncCalendar(request);
}
