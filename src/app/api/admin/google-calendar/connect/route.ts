import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getAdminSession } from "@/lib/auth";
import { googleCalendarConfig, googleRedirectUri } from "@/lib/google-calendar";

export async function GET(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { clientId, clientSecret, encryptionKey } = googleCalendarConfig();
  if (!clientId || !clientSecret || !encryptionKey) return NextResponse.json({ error: "A integração ainda precisa ser configurada no ambiente do app." }, { status: 503 });
  const state = randomBytes(24).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(request.url),
    response_type: "code",
    scope: "openid email https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("google_calendar_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return response;
}
