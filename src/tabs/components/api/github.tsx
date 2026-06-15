/**
 * GitHub API integration
 * Fetches the user's open pull requests, review requests and assigned issues
 * using a Personal Access Token (free for personal accounts).
 */

import { getGithubCredentials } from "./storage";

const GITHUB_API = "https://api.github.com";

// ============================================
// Types
// ============================================

export interface GitItem {
  id: string;
  title: string;
  url: string;
  repo: string;
  number: number;
  type: "pr" | "issue" | "mr";
  state: string;
  draft?: boolean;
  reviewRequested?: boolean;
}

// ============================================
// Internal helpers
// ============================================

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

/** Derive "owner/repo" from a search result item. */
const getRepoName = (item: any): string => {
  // repository_url looks like https://api.github.com/repos/owner/repo
  if (item.repository_url) {
    return item.repository_url.replace(`${GITHUB_API}/repos/`, "");
  }
  // Fallback: parse from html_url
  const match = (item.html_url || "").match(/github\.com\/([^/]+\/[^/]+)\//);
  return match ? match[1] : "";
};

const mapItem = (
  item: any,
  type: "pr" | "issue",
  reviewRequested = false
): GitItem => ({
  id: String(item.id),
  title: item.title || "Untitled",
  url: item.html_url,
  repo: getRepoName(item),
  number: item.number,
  type,
  state: item.draft ? "draft" : item.state || "open",
  draft: !!item.draft,
  reviewRequested,
});

const search = async (
  token: string,
  query: string
): Promise<any[]> => {
  try {
    const url = `${GITHUB_API}/search/issues?q=${encodeURIComponent(
      query
    )}&per_page=20&sort=updated&order=desc`;
    const response = await fetch(url, { headers: getAuthHeaders(token) });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
};

// ============================================
// Public API
// ============================================

/**
 * Fetch the current user's open work on GitHub:
 *  - PRs where their review is requested
 *  - PRs they authored
 *  - issues assigned to them
 */
export const fetchGithubItems = async (): Promise<GitItem[]> => {
  const { github_token } = await getGithubCredentials();
  if (!github_token) return [];

  const [reviewItems, authoredItems, assignedItems] = await Promise.all([
    search(github_token, "is:open is:pr review-requested:@me"),
    search(github_token, "is:open is:pr author:@me"),
    search(github_token, "is:open is:issue assignee:@me"),
  ]);

  const byId = new Map<string, GitItem>();

  reviewItems.forEach((i) => {
    const mapped = mapItem(i, "pr", true);
    byId.set(mapped.id, mapped);
  });
  authoredItems.forEach((i) => {
    const mapped = mapItem(i, "pr");
    // Don't overwrite a review-requested flag if already present
    if (!byId.has(mapped.id)) byId.set(mapped.id, mapped);
  });
  assignedItems.forEach((i) => {
    const mapped = mapItem(i, "issue");
    if (!byId.has(mapped.id)) byId.set(mapped.id, mapped);
  });

  return Array.from(byId.values());
};
