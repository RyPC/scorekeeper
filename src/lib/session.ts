import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sk_session";

function getSecret() {
  const raw = process.env.SESSION_SECRET;
  if (!raw) {
    throw new Error("Missing SESSION_SECRET");
  }
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}
