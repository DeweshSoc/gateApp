import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * AES-256-GCM encryption for provider API keys at rest.
 *
 * The 32-byte key is derived from `ENCRYPTION_KEY` (64 hex chars recommended).
 * Output format: `v1:<ivHex>:<authTagHex>:<ciphertextHex>`.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const VERSION = "v1";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set. Add a 64-char hex value to .env.");
  }

  // Accept a raw 32-byte hex key, otherwise derive deterministically from the string.
  const isHex64 = /^[0-9a-fA-F]{64}$/.test(raw);
  cachedKey = isHex64
    ? Buffer.from(raw, "hex")
    : scryptSync(raw, "gate-2027-ai-static-salt", 32);

  return cachedKey;
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [VERSION, iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(
    ":",
  );
}

export function decrypt(payload: string): string {
  if (!payload) return "";
  const parts = payload.split(":");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted payload.");
  }

  const [version, ivHex, tagHex, dataHex] = parts;
  if (version !== VERSION || !ivHex || !tagHex || !dataHex) {
    throw new Error("Unsupported encrypted payload format.");
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/** Mask a key for safe display (never return the full value to the client). */
export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
