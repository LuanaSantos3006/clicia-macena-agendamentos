import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminSession } from "@/lib/auth";
import { encryptRefreshToken, googleCalendarConfig, googleRedirectUri } from "@/lib/google-calendar";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = new URL("/admin/configuracoes", url.origin);
  if (!await getAdminSession()) return NextResponse.redirect(new URL("/admin/login", url.origin));
  const state = url.searchParams.get("state");
  const stateCookie = request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith("google_calendar_oauth_state="))?.split("=").slice(1).join("=");
  if (!state || !stateCookie || decodeURIComponent(stateCookie) !== state) {
    returnTo.searchParams.set("calendar", "state-error");
    return NextResponse.redirect(returnTo);
  }
  const { clientId, clientSecret } = googleCalendarConfig();
  const code = url.searchParams.get("code");
  if (!code || url.searchParams.get("error")) {
    returnTo.searchParams.set("calendar", "denied");
    return NextResponse.redirect(returnTo);
  }
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: googleRedirectUri(request.url), grant_type: "authorization_code" }),
    });
    const token = await tokenResponse.json() as { access_token?: string; refresh_token?: string; error?: string };
    if (!tokenResponse.ok || !token.access_token || !token.refresh_token) throw new Error("Não foi possível obter uma credencial de atualização.");
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
    const profile = await profileResponse.json().catch(() => ({})) as { email?: string };
    await adminDb().collection("settings").doc("googleCalendarConnection").set({
      encryptedRefreshToken: encryptRefreshToken(token.refresh_token),
      accountEmail: profile.email || "",
      connectedAt: FieldValue.serverTimestamp(),
      calendarId: "primary",
    });
    returnTo.searchParams.set("calendar", "connected");
    const response = NextResponse.redirect(returnTo);
    response.cookies.delete("google_calendar_oauth_state");
    return response;
  } catch {
    returnTo.searchParams.set("calendar", "error");
    return NextResponse.redirect(returnTo);
  }
}
