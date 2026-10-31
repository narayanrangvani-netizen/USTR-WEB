export const ADMIN_SESSION_COOKIE = "ustr_admin_session";

async function importSessionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "ustr-suits-secret";
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signAdminSession() {
  const payload = JSON.stringify({ role: "owner", email: "owner@ustrsuits.com" });
  const key = await importSessionKey();
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(new Uint8Array(signature))}`;
}

export async function verifySessionValue(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;

  const key = await importSessionKey();
  const signatureBytes = Uint8Array.from(
    signature.match(/.{2}/g) ?? [],
    (byte) => Number.parseInt(byte, 16),
  );
  return globalThis.crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(payload),
  );
}
