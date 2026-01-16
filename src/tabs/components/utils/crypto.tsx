/**
 * Encryption utilities using Web Crypto API
 * AES-GCM encryption for secure credential storage
 * Uses user-specific salt for enhanced security
 */

const SALT_STORAGE_KEY = "rtk_user_salt";

/**
 * Get or generate a user-specific salt
 * This salt is unique per Chrome profile and stored locally (not synced)
 */
const getUserSalt = async (): Promise<Uint8Array> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([SALT_STORAGE_KEY], async (result) => {
      if (result[SALT_STORAGE_KEY]) {
        // Convert stored array back to Uint8Array
        const saltArray = new Uint8Array(result[SALT_STORAGE_KEY]);
        resolve(saltArray);
      } else {
        // Generate new random salt (32 bytes)
        const newSalt = crypto.getRandomValues(new Uint8Array(32));
        // Store as regular array (Uint8Array doesn't serialize well)
        chrome.storage.local.set({ [SALT_STORAGE_KEY]: Array.from(newSalt) }, () => {
          resolve(newSalt);
        });
      }
    });
  });
};

/**
 * Generate encryption key using user-specific salt
 * Each user/Chrome profile will have a unique encryption key
 */
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const extensionId = chrome.runtime?.id || "relax-the-kax-extension";
  const userSalt = await getUserSalt();
  
  // Combine extension ID with user salt for key material
  const encoder = new TextEncoder();
  const extensionIdBytes = encoder.encode(extensionId);
  
  // Create key material from extension ID
  const keyData = new Uint8Array(extensionIdBytes.length + userSalt.length);
  keyData.set(extensionIdBytes);
  keyData.set(userSalt, extensionIdBytes.length);

  // Import the key material
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive AES-GCM key with user-specific salt
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: userSalt.buffer as ArrayBuffer,
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
};

/**
 * Decrypt a string using AES-GCM
 */
export const decrypt = async (ciphertext: string): Promise<string> => {
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
