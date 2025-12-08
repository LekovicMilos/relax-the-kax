/**
 * Chrome Storage API utilities
 * Credentials are encrypted before storage using AES-GCM
 */

import { encrypt, decrypt, isEncrypted } from "../utils/crypto";

interface StorageOptions {
  randomPhotos: any[];
  date: string;
  jira_email: string;
  jira_token: string;
  jira_domain: string;
}

const DEFAULT_OPTIONS: StorageOptions = {
  randomPhotos: [],
  date: "",
  jira_email: "",
  jira_token: "",
  jira_domain: "",
};

// ============================================
// Jira Credentials (Encrypted)
// ============================================

export interface JiraCredentials {
  jira_email: string;
  jira_token: string;
  jira_domain: string;
}

/**
 * Save Jira credentials with encryption
 * Token is encrypted before storage for security
 */
export const saveJiraCredentials = async (
  email: string,
  token: string,
  domain: string
): Promise<boolean> => {
  try {
    // Encrypt sensitive data
    const encryptedToken = await encrypt(token);
    const encryptedEmail = await encrypt(email);

    return new Promise((resolve) => {
      chrome.storage.sync.set(
        {
          jira_email: encryptedEmail,
          jira_token: encryptedToken,
          jira_domain: domain, // Domain is not sensitive
        },
        () => resolve(true)
      );
    });
  } catch (error) {
    console.error("Failed to save credentials:", error);
    return false;
  }
};

/**
 * Get Jira credentials with decryption
 * Handles both encrypted and legacy unencrypted data
 */
export const getJiraCredentials = async (): Promise<JiraCredentials> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["jira_email", "jira_token", "jira_domain"],
      async (result) => {
        try {
          let email = result.jira_email || "";
          let token = result.jira_token || "";
          const domain = result.jira_domain || "";

          // Decrypt if encrypted (check for legacy unencrypted data)
          if (email && isEncrypted(email)) {
            email = await decrypt(email);
          }
          if (token && isEncrypted(token)) {
            token = await decrypt(token);
          }

          resolve({
            jira_email: email,
            jira_token: token,
            jira_domain: domain,
          });
        } catch (error) {
          console.error("Failed to decrypt credentials:", error);
          // Return empty on decryption failure
          resolve({
            jira_email: "",
            jira_token: "",
            jira_domain: "",
          });
        }
      }
    );
  });
};

/**
 * Check if Jira credentials are configured
 */
export const hasJiraCredentials = async (): Promise<boolean> => {
  const creds = await getJiraCredentials();
  return !!(creds.jira_email && creds.jira_token && creds.jira_domain);
};

/**
 * Clear Jira credentials
 */
export const clearJiraCredentials = (): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(
      ["jira_email", "jira_token", "jira_domain"],
      () => resolve(true)
    );
  });
};

// ============================================
// General Storage (Photos cache)
// ============================================

export const saveToStorage = (
  options: Partial<StorageOptions>
): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set(options, () => resolve(true));
  });
};

export const restoreFromStorage = (): Promise<StorageOptions> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_OPTIONS, (options) => {
      resolve(options as StorageOptions);
    });
  });
};
