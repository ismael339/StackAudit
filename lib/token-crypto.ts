import { createHmac } from "crypto";

/**
 * Reversible token encryption using an HMAC-tagged XOR stream derived
 * from SHOPIFY_API_SECRET. Suitable for protecting tokens at rest in
 * the database; for stricter requirements swap in Supabase Vault/KMS.
 */

function deriveKey(): Buffer {
  const secret = process.env.SHOPIFY_API_SECRET ?? "stackaudit-dev-secret";
  return createHmac("sha256", secret).update("stackaudit-token-key").digest();
}

function sign(data: Buffer): string {
  const secret = process.env.SHOPIFY_API_SECRET ?? "stackaudit-dev-secret";
  return createHmac("sha256", secret).update(data).digest("hex").slice(0, 16);
}

export function encryptToken(token: string): string {
  const key = deriveKey();
  const data = Buffer.from(token, "utf8");
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ key[i % key.length];
  }
  return `${sign(data)}:${out.toString("base64")}`;
}

export function decryptToken(stored: string): string {
  const [tag, payload] = stored.split(":");
  if (!tag || !payload) return "";
  const key = deriveKey();
  const data = Buffer.from(payload, "base64");
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ key[i % key.length];
  }
  if (sign(out) !== tag) return "";
  return out.toString("utf8");
}
