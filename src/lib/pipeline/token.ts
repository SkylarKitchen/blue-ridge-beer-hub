import { createHmac, timingSafeEqual } from "node:crypto";

/** Payload carried by the emailed publish link. `exp` is unix milliseconds. */
export interface ApprovalPayload {
  draftIds: string[];
  exp: number;
}

function hmac(body: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(body).digest();
}

export function signApprovalToken(
  payload: ApprovalPayload,
  secret: string,
): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body, secret).toString("base64url")}`;
}

export function verifyApprovalToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): ApprovalPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = hmac(body, secret);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (
      !Array.isArray(payload.draftIds) ||
      !payload.draftIds.every((id: unknown) => typeof id === "string") ||
      typeof payload.exp !== "number" ||
      payload.exp < now
    ) {
      return null;
    }
    return { draftIds: payload.draftIds, exp: payload.exp };
  } catch {
    return null;
  }
}
