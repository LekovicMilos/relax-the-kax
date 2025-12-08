/**
 * Encryption utilities using Web Crypto API
 * AES-GCM encryption for secure credential storage
 */

// Generate a consistent key from extension context
const getEncryptionKey = async (): Promise<CryptoKey> => {
  // Use extension ID + fixed salt as key material
  // This ensures the key is consistent but unique per extension
  const extensionId = chrome.runtime?.id || "relax-the-kax-extension";
  const salt = "rtk-secure-storage-v1";
  const keyMaterial = `${extensionId}-${salt}`;

  // Import the key material
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  // Derive a proper crypto key using PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypt a string using AES-GCM
 */
export const encrypt = async (plaintext: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw error;
  }
};

/**
 * Decrypt a string using AES-GCM
 */
export const decrypt = async (ciphertext: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();

    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
};

/**
 * Check if a string is encrypted (base64 with expected length)
 */
export const isEncrypted = (value: string): boolean => {
  if (!value) return false;
  // Encrypted values are base64 and have minimum length (IV + some data)
  try {
    const decoded = atob(value);
    return decoded.length > 12; // At least IV size
  } catch {
    return false;
  }
};
