import { createDecipheriv, createCipheriv, randomBytes } from "node:crypto";
import { adminDb } from "@/lib/firebase-admin";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKEN_DOC = "googleCalendarConnection";

export function googleCalendarConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    encryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "",
  };
}

export function googleRedirectUri(requestUrl: string) {
  return process.env.GOOGLE_REDIRECT_URI || new URL("/api/admin/google-calendar/callback", requestUrl).toString();
}

function encryptionKey() {
  const raw = googleCalendarConfig().encryptionKey;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("Configure GOOGLE_TOKEN_ENCRYPTION_KEY com 32 bytes em base64.");
  return key;
}

export function encryptRefreshToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptRefreshToken(value: string) {
  const [ivText, tagText, encryptedText] = value.split(".");
  if (!ivText || !tagText || !encryptedText) throw new Error("Credencial do Google inválida.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = googleCalendarConfig();
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" });
  const response = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await response.json().catch(() => ({})) as { access_token?: string; error?: string };
  if (!response.ok || !data.access_token) throw new Error("Não foi possível renovar a autorização do Google. Reconecte a agenda.");
  return data.access_token;
}

export async function googleCalendarConnection() {
  const snap = await adminDb().collection("settings").doc(TOKEN_DOC).get();
  return snap.exists ? snap.data() || null : null;
}
