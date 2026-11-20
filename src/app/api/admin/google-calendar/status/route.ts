import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { googleCalendarConfig, googleCalendarConnection } from "@/lib/google-calendar";

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { clientId, clientSecret, encryptionKey } = googleCalendarConfig();
  const connection = await googleCalendarConnection();
  return NextResponse.json({
    configured: Boolean(clientId && clientSecret && encryptionKey),
    connected: Boolean(connection?.encryptedRefreshToken),
    accountEmail: connection?.accountEmail || null,
    connectedAt: connection?.connectedAt?.toDate?.().toISOString?.() || null,
    lastSyncedAt: connection?.lastSyncedAt?.toDate?.().toISOString?.() || null,
  });
}
