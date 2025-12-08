/**
 * Jira API integration
 * Handles authentication and ticket fetching from Jira Cloud
 */

import { encodeBase64 } from "../utils/string";
import { getJiraCredentials, JiraCredentials } from "./storage";

// ============================================
// Types
// ============================================

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory?: string;
  assignee: string;
  url: string;
  priority?: string;
  issueType?: string;
}

interface JiraUser {
  accountId: string;
  displayName: string;
}

// ============================================
// Internal Helpers
// ============================================

const getAuthHeaders = (creds: JiraCredentials) => {
  const encoded = encodeBase64(`${creds.jira_email}:${creds.jira_token}`);
  return {
    Authorization: `Basic ${encoded}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

const getBaseUrl = (creds: JiraCredentials): string => {
  const domain = creds.jira_domain.replace(/^https?:\/\//, '');
  return `https://${domain}`;
};

const mapIssueToTicket = (issue: any, baseUrl: string): JiraTicket => ({
  id: issue.id,
  key: issue.key,
  summary: issue.fields?.summary || "No summary",
  status: issue.fields?.status?.name || "Unknown",
  statusCategory: issue.fields?.status?.statusCategory?.name || "Unknown",
  assignee: issue.fields?.assignee?.displayName || "Unassigned",
  url: `${baseUrl}/browse/${issue.key}`,
  priority: issue.fields?.priority?.name,
  issueType: issue.fields?.issuetype?.name,
});

const getCurrentUser = async (creds: JiraCredentials, baseUrl: string): Promise<JiraUser | null> => {
  try {
    const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
      headers: getAuthHeaders(creds),
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
};

const searchTickets = async (
  creds: JiraCredentials,
  baseUrl: string,
  jql: string,
  maxResults = 20
): Promise<JiraTicket[]> => {
  try {
    const response = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
      method: "POST",
      headers: getAuthHeaders(creds),
      body: JSON.stringify({
        jql,
        fields: ["summary", "status", "assignee", "key", "priority", "issuetype"],
        maxResults,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.issues || []).map((issue: any) => mapIssueToTicket(issue, baseUrl));
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
};

// ============================================
// Public API
// ============================================

/**
 * Fetch tickets with "In Progress" status
 */
export const fetchInProgressTickets = async (): Promise<JiraTicket[]> => {
  const creds = await getJiraCredentials();
  if (!creds.jira_email || !creds.jira_token || !creds.jira_domain) {
    return [];
  }

  const baseUrl = getBaseUrl(creds);

  // Try with email first
  let jql = `assignee = "${creds.jira_email}" AND status = "In Progress" ORDER BY updated DESC`;
  let tickets = await searchTickets(creds, baseUrl, jql);

  // Fallback to accountId if email didn't work
  if (tickets.length === 0) {
    const user = await getCurrentUser(creds, baseUrl);
    if (user) {
      jql = `assignee = "${user.accountId}" AND status = "In Progress" ORDER BY updated DESC`;
      tickets = await searchTickets(creds, baseUrl, jql);
    }
  }

  return tickets;
};

/**
 * Fetch tickets with "To Do" status category
 */
export const fetchToDoTickets = async (): Promise<JiraTicket[]> => {
  const creds = await getJiraCredentials();
  if (!creds.jira_email || !creds.jira_token || !creds.jira_domain) {
    return [];
  }

  const baseUrl = getBaseUrl(creds);

  // Try with email first
  let jql = `assignee = "${creds.jira_email}" AND statusCategory = "To Do" ORDER BY updated DESC`;
  let tickets = await searchTickets(creds, baseUrl, jql);

  // Fallback to accountId if email didn't work
  if (tickets.length === 0) {
    const user = await getCurrentUser(creds, baseUrl);
    if (user) {
      jql = `assignee = "${user.accountId}" AND statusCategory = "To Do" ORDER BY updated DESC`;
      tickets = await searchTickets(creds, baseUrl, jql);
    }
  }

  return tickets;
};

/**
 * Get current user's first name
 */
export const getJiraUserName = async (): Promise<string | null> => {
  const creds = await getJiraCredentials();
  if (!creds.jira_email || !creds.jira_token || !creds.jira_domain) {
    return null;
  }

  const baseUrl = getBaseUrl(creds);
  const user = await getCurrentUser(creds, baseUrl);
  
  if (user?.displayName) {
    return user.displayName.split(" ")[0];
  }
  return null;
};

/**
 * Test Jira connection
 */
export const testJiraConnection = async (): Promise<{ success: boolean; message: string }> => {
  const creds = await getJiraCredentials();
  if (!creds.jira_email || !creds.jira_token || !creds.jira_domain) {
    return { success: false, message: "Credentials not configured" };
  }

  const baseUrl = getBaseUrl(creds);
  const user = await getCurrentUser(creds, baseUrl);

  if (user) {
    return { success: true, message: `Connected as ${user.displayName}` };
  }
  return { success: false, message: "Authentication failed" };
};
