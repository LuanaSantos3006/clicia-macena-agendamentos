import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "clicia_admin_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-change-me");

export async function createAdminSession(email: string) {
  const token = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin" ? payload : null;
  } catch { return null; }
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
