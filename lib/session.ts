import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "dlab_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "dlab-admin-local-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@dlab.com",
    password: process.env.ADMIN_PASSWORD ?? "MMCAdmin@Dlab",
  };
}

function createToken(email: string) {
  const payload = base64UrlEncode(
    JSON.stringify({ email, issuedAt: Date.now() }),
  );
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function verifyToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payload, signature] = parts;
    const expectedSignature = signPayload(payload);

    if (signature.length !== expectedSignature.length) {
      return false;
    }

    const isValidSignature = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
    if (!isValidSignature) return false;

    const decoded = base64UrlDecode(payload);
    const parsed = JSON.parse(decoded) as { email?: string; issuedAt?: number };
    const email = parsed.email;
    const issuedAt = Number(parsed.issuedAt);

    if (!email) return false;

    const ageSeconds = (Date.now() - issuedAt) / 1000;
    if (!Number.isFinite(ageSeconds) || ageSeconds > SESSION_MAX_AGE_SECONDS) {
      return false;
    }

    const { email: adminEmail } = getAdminCredentials();
    return email === adminEmail;
  } catch {
    return false;
  }
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function hasValidAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token);
}

export async function requireAdminSession() {
  const valid = await hasValidAdminSession();
  if (!valid) redirect("/");
}
