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
/**
 * Validate Jira domain format
 * Accepts: company.atlassian.net, company.jira.com, or custom domains
 */
export const isValidJiraDomain = (domain: string): boolean => {
  if (!domain) return false;
  
  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, '').toLowerCase();
  
  // Check for valid Atlassian domains
  const validPatterns = [
    /^[\w-]+\.atlassian\.net$/,
    /^[\w-]+\.atlassian\.com$/,
    /^[\w-]+\.jira\.com$/,
  ];
  
  return validPatterns.some(pattern => pattern.test(cleanDomain));
};

export const saveJiraCredentials = async (
  email: string,
  token: string,
  domain: string
): Promise<{ success: boolean; error?: string }> => {
  // Validate domain before saving
  if (!isValidJiraDomain(domain)) {
    return { 
      success: false, 
      error: "Invalid Jira domain. Use format: company.atlassian.net" 
    };
  }

  try {
    // Encrypt sensitive data
    const encryptedToken = await encrypt(token);
    const encryptedEmail = await encrypt(email);

    return new Promise((resolve) => {
      chrome.storage.sync.set(
        {
          jira_email: encryptedEmail,
          jira_token: encryptedToken,
          jira_domain: domain.replace(/^https?:\/\//, ''), // Store clean domain
        },
        () => resolve({ success: true })
      );
    });
  } catch {
    return { success: false, error: "Failed to save credentials" };
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
        } catch {
          // Return empty on decryption failure (silent fail)
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
// Jira Status Preferences
// ============================================

export interface JiraStatusPreferences {
  statuses: string[];
}

// Available status options
export const JIRA_STATUS_OPTIONS = [
  { id: "in_progress", label: "In Progress", jql: 'status = "In Progress"' },
  { id: "to_do", label: "To Do", jql: 'statusCategory = "To Do"' },
  { id: "in_review", label: "In Review", jql: 'status = "In Review"' },
  { id: "code_review", label: "Code Review", jql: 'status = "Code Review"' },
  { id: "blocked", label: "Blocked", jql: 'status = "Blocked"' },
  { id: "done_today", label: "Done Today", jql: 'status = "Done" AND updated >= startOfDay()' },
];

const DEFAULT_STATUSES = ["in_progress"];

/**
 * Save Jira status preferences
 */
export const saveJiraStatusPreferences = (statuses: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ jira_statuses: statuses }, () => resolve(true));
  });
};

/**
 * Get Jira status preferences
 */
export const getJiraStatusPreferences = (): Promise<string[]> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ jira_statuses: DEFAULT_STATUSES }, (result) => {
      resolve(result.jira_statuses);
    });
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
