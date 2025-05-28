export async function encrypt(data: string, password: string): Promise<Uint8Array> {
  const key = await deriveKey(password);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(data),
  );
  const res = new Uint8Array(iv.byteLength + encrypted.byteLength);
  res.set(iv, 0);
  res.set(new Uint8Array(encrypted), iv.byteLength);
  return res;
}

export async function decrypt(data: Uint8Array, password: string): Promise<Uint8Array> {
  const key = await deriveKey(password);
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  return new Uint8Array(await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted,
  ));
}

async function deriveKey(password: string): Promise<CryptoKey> {
  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode("Golem dPaste"),
      iterations: 1_000_000,
    },
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
