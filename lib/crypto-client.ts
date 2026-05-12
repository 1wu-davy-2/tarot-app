/**
 * Browser-compatible AES-256-GCM decryption for the encrypted DeepSeek API key.
 * Mirrors the server-side encryption in backend/routers/ai_config.py
 * and the Node.js decryption in app/api/interpret/route.ts.
 *
 * Encryption format: base64(nonce[12B] + ciphertext + tag[16B])
 * Key derived via SHA-256 from the shared secret.
 */

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["decrypt"]);
}

export async function decryptApiKey(encryptedBase64: string): Promise<string> {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
  if (!secret) throw new Error("ENCRYPTION_KEY is not set");

  const data = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const nonce = data.slice(0, 12);
  const ciphertext = data.slice(12);

  const key = await deriveKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce, tagLength: 128 },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
