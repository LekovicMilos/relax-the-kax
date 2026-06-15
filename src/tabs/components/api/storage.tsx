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
// GitHub Credentials (Encrypted)
// ============================================

export interface GithubCredentials {
  github_token: string;
}

/**
 * Save GitHub Personal Access Token (encrypted)
 * GitHub's REST API is free for personal accounts.
 */
export const saveGithubCredentials = async (
  token: string
): Promise<{ success: boolean; error?: string }> => {
  if (!token) {
    return { success: false, error: "Please enter your GitHub token" };
  }

  try {
    const encryptedToken = await encrypt(token);
    return new Promise((resolve) => {
      chrome.storage.sync.set(
        { github_token: encryptedToken },
        () => resolve({ success: true })
      );
    });
  } catch {
    return { success: false, error: "Failed to save credentials" };
  }
};

/**
 * Get GitHub credentials with decryption
 */
export const getGithubCredentials = async (): Promise<GithubCredentials> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["github_token"], async (result) => {
      try {
        let token = result.github_token || "";
        if (token && isEncrypted(token)) {
          token = await decrypt(token);
        }
        resolve({ github_token: token });
      } catch {
        resolve({ github_token: "" });
      }
    });
  });
};

/**
 * Check if GitHub credentials are configured
 */
export const hasGithubCredentials = async (): Promise<boolean> => {
  const creds = await getGithubCredentials();
  return !!creds.github_token;
};

/**
 * Clear GitHub credentials
 */
export const clearGithubCredentials = (): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(["github_token"], () => resolve(true));
  });
};

// ============================================
// GitLab Credentials (Encrypted)
// ============================================

export const DEFAULT_GITLAB_DOMAIN = "gitlab.com";

export interface GitlabCredentials {
  gitlab_token: string;
  gitlab_domain: string;
}

/**
 * Save GitLab Personal Access Token (encrypted) and host domain.
 * GitLab's REST API is free on gitlab.com and self-hosted instances.
 */
export const saveGitlabCredentials = async (
  token: string,
  domain: string
): Promise<{ success: boolean; error?: string }> => {
  if (!token) {
    return { success: false, error: "Please enter your GitLab token" };
  }

  const cleanDomain = (domain || DEFAULT_GITLAB_DOMAIN)
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  try {
    const encryptedToken = await encrypt(token);
    return new Promise((resolve) => {
      chrome.storage.sync.set(
        { gitlab_token: encryptedToken, gitlab_domain: cleanDomain },
        () => resolve({ success: true })
      );
    });
  } catch {
    return { success: false, error: "Failed to save credentials" };
  }
};

/**
 * Get GitLab credentials with decryption
 */
export const getGitlabCredentials = async (): Promise<GitlabCredentials> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["gitlab_token", "gitlab_domain"],
      async (result) => {
        try {
          let token = result.gitlab_token || "";
          const domain = result.gitlab_domain || DEFAULT_GITLAB_DOMAIN;
          if (token && isEncrypted(token)) {
            token = await decrypt(token);
          }
          resolve({ gitlab_token: token, gitlab_domain: domain });
        } catch {
          resolve({ gitlab_token: "", gitlab_domain: DEFAULT_GITLAB_DOMAIN });
        }
      }
    );
  });
};

/**
 * Check if GitLab credentials are configured
 */
export const hasGitlabCredentials = async (): Promise<boolean> => {
  const creds = await getGitlabCredentials();
  return !!creds.gitlab_token;
};

/**
 * Clear GitLab credentials
 */
export const clearGitlabCredentials = (): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(
      ["gitlab_token", "gitlab_domain"],
      () => resolve(true)
    );
  });
};

// ============================================
// Trello Credentials (Encrypted)
// ============================================

export interface TrelloCredentials {
  trello_key: string;
  trello_token: string;
}

/**
 * Save Trello API key + token (encrypted).
 * Trello's REST API is free for personal accounts.
 */
export const saveTrelloCredentials = async (
  key: string,
  token: string
): Promise<{ success: boolean; error?: string }> => {
  if (!key || !token) {
    return { success: false, error: "Please enter your Trello API key and token" };
  }

  try {
    const encryptedKey = await encrypt(key);
    const encryptedToken = await encrypt(token);
    return new Promise((resolve) => {
      chrome.storage.sync.set(
        { trello_key: encryptedKey, trello_token: encryptedToken },
        () => resolve({ success: true })
      );
    });
  } catch {
    return { success: false, error: "Failed to save credentials" };
  }
};

export const getTrelloCredentials = async (): Promise<TrelloCredentials> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["trello_key", "trello_token"], async (result) => {
      try {
        let key = result.trello_key || "";
        let token = result.trello_token || "";
        if (key && isEncrypted(key)) key = await decrypt(key);
        if (token && isEncrypted(token)) token = await decrypt(token);
        resolve({ trello_key: key, trello_token: token });
      } catch {
        resolve({ trello_key: "", trello_token: "" });
      }
    });
  });
};

export const hasTrelloCredentials = async (): Promise<boolean> => {
  const creds = await getTrelloCredentials();
  return !!(creds.trello_key && creds.trello_token);
};

export const clearTrelloCredentials = (): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(
      [
        "trello_key",
        "trello_token",
        "trello_board_id",
        "trello_list_ids",
        "trello_only_mine",
      ],
      () => resolve(true)
    );
  });
};

/**
 * Trello board / column filter.
 * - boardId "" means "show cards assigned to me across all boards".
 * - listIds [] means "all columns" of the selected board.
 * - onlyMine limits a board's columns to cards assigned to the member.
 */
export interface TrelloFilter {
  boardId: string;
  listIds: string[];
  onlyMine: boolean;
}

export const saveTrelloFilter = (
  boardId: string,
  listIds: string[],
  onlyMine: boolean
): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      {
        trello_board_id: boardId,
        trello_list_ids: listIds,
        trello_only_mine: onlyMine,
      },
      () => resolve(true)
    );
  });
};

export const getTrelloFilter = (): Promise<TrelloFilter> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      { trello_board_id: "", trello_list_ids: [], trello_only_mine: false },
      (result) => {
        resolve({
          boardId: result.trello_board_id || "",
          listIds: Array.isArray(result.trello_list_ids)
            ? result.trello_list_ids
            : [],
          onlyMine: !!result.trello_only_mine,
        });
      }
    );
  });
};

// ============================================
// Notion Credentials (Encrypted)
// ============================================

export interface NotionCredentials {
  notion_token: string;
}

/**
 * Save Notion internal integration token (encrypted).
 * Notion's API is free.
 */
export const saveNotionCredentials = async (
  token: string
): Promise<{ success: boolean; error?: string }> => {
  if (!token) {
    return { success: false, error: "Please enter your Notion integration token" };
  }

  try {
    const encryptedToken = await encrypt(token);
    return new Promise((resolve) => {
      chrome.storage.sync.set(
        { notion_token: encryptedToken },
        () => resolve({ success: true })
      );
    });
  } catch {
    return { success: false, error: "Failed to save credentials" };
  }
};

export const getNotionCredentials = async (): Promise<NotionCredentials> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["notion_token"], async (result) => {
      try {
        let token = result.notion_token || "";
        if (token && isEncrypted(token)) token = await decrypt(token);
        resolve({ notion_token: token });
      } catch {
        resolve({ notion_token: "" });
      }
    });
  });
};

export const hasNotionCredentials = async (): Promise<boolean> => {
  const creds = await getNotionCredentials();
  return !!creds.notion_token;
};

export const clearNotionCredentials = (): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(["notion_token"], () => resolve(true));
  });
};

// ============================================
// Linear Credentials (Encrypted)
// ============================================

export interface LinearCredentials {
  linear_token: string;
}

/**
 * Save Linear personal API key (encrypted).
 * Linear's API is free, including on the free plan.
 */
export const saveLinearCredentials = async (
  token: string
): Promise<{ success: boolean; error?: string }> => {
  if (!token) {
    return { success: false, error: "Please enter your Linear API key" };
  }

  try {
    const encryptedToken = await encrypt(token);
    return new Promise((resolve) => {
      chrome.storage.sync.set(
        { linear_token: encryptedToken },
        () => resolve({ success: true })
      );
    });
  } catch {
    return { success: false, error: "Failed to save credentials" };
  }
};

export const getLinearCredentials = async (): Promise<LinearCredentials> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["linear_token"], async (result) => {
      try {
        let token = result.linear_token || "";
        if (token && isEncrypted(token)) token = await decrypt(token);
        resolve({ linear_token: token });
      } catch {
        resolve({ linear_token: "" });
      }
    });
  });
};

export const hasLinearCredentials = async (): Promise<boolean> => {
  const creds = await getLinearCredentials();
  return !!creds.linear_token;
};

export const clearLinearCredentials = (): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(["linear_token"], () => resolve(true));
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
// Layout Preference
// ============================================

export type LayoutMode = "myday" | "boards" | "tabs";

const DEFAULT_LAYOUT: LayoutMode = "myday";

/**
 * Save the preferred dashboard layout.
 * - myday:  all items aggregated into a single box
 * - boards: one panel per connected service (side by side)
 * - tabs:   a single box with a tab per service
 */
export const saveLayoutMode = (mode: LayoutMode): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ layout_mode: mode }, () => resolve(true));
  });
};

export const getLayoutMode = (): Promise<LayoutMode> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ layout_mode: DEFAULT_LAYOUT }, (result) => {
      resolve(result.layout_mode as LayoutMode);
    });
  });
};

// ============================================
// User Name
// ============================================

/**
 * Save user's display name
 */
export const saveUserName = (name: string): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ user_name: name }, () => resolve(true));
  });
};

/**
 * Get user's display name
 */
export const getUserName = (): Promise<string> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ user_name: "" }, (result) => {
      resolve(result.user_name);
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
