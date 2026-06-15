/**
 * GitLab API integration
 * Fetches the user's open merge requests (assigned + review requested) and
 * assigned issues using a Personal Access Token. Free on gitlab.com and
 * self-hosted instances.
 */

import { getGitlabCredentials, DEFAULT_GITLAB_DOMAIN } from "./storage";
import { GitItem } from "./github";

export type { GitItem } from "./github";

// ============================================
// Internal helpers
// ============================================

const getAuthHeaders = (token: string) => ({
  "PRIVATE-TOKEN": token,
  Accept: "application/json",
});

const getBaseUrl = (domain: string): string => {
  const clean = (domain || DEFAULT_GITLAB_DOMAIN)
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  return `https://${clean}/api/v4`;
};

/** GitLab references.full looks like "group/project!12" or "group/project#34". */
const getRepoName = (item: any): string => {
  const full = item.references?.full || "";
  return full.replace(/[!#]\d+$/, "");
};

const mapMr = (item: any, reviewRequested = false): GitItem => ({
  id: `mr-${item.id}`,
  title: item.title || "Untitled",
  url: item.web_url,
  repo: getRepoName(item),
  number: item.iid,
  type: "mr",
  state: item.draft || item.work_in_progress ? "draft" : item.state || "opened",
  draft: !!(item.draft || item.work_in_progress),
  reviewRequested,
});

const mapIssue = (item: any): GitItem => ({
  id: `issue-${item.id}`,
  title: item.title || "Untitled",
  url: item.web_url,
  repo: getRepoName(item),
  number: item.iid,
  type: "issue",
  state: item.state || "opened",
});

const fetchJson = async (
  baseUrl: string,
  token: string,
  path: string
): Promise<any[]> => {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: getAuthHeaders(token),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

/** Get the authenticated user's numeric id (needed for reviewer filtering). */
const getCurrentUserId = async (
  baseUrl: string,
  token: string
): Promise<number | null> => {
  try {
    const response = await fetch(`${baseUrl}/user`, {
      headers: getAuthHeaders(token),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.id === "number" ? data.id : null;
  } catch {
    return null;
  }
};

// ============================================
// Public API
// ============================================

/**
 * Fetch the current user's open work on GitLab:
 *  - MRs assigned to them
 *  - MRs where they are a reviewer
 *  - issues assigned to them
 */
export const fetchGitlabItems = async (): Promise<GitItem[]> => {
  const { gitlab_token, gitlab_domain } = await getGitlabCredentials();
  if (!gitlab_token) return [];

  const baseUrl = getBaseUrl(gitlab_domain);
  const userId = await getCurrentUserId(baseUrl, gitlab_token);

  const reviewPath = userId
    ? `/merge_requests?scope=all&reviewer_id=${userId}&state=opened&per_page=20&order_by=updated_at`
    : null;

  const [assignedMrs, reviewMrs, assignedIssues] = await Promise.all([
    fetchJson(
      baseUrl,
      gitlab_token,
      "/merge_requests?scope=assigned_to_me&state=opened&per_page=20&order_by=updated_at"
    ),
    reviewPath
      ? fetchJson(baseUrl, gitlab_token, reviewPath)
      : Promise.resolve([]),
    fetchJson(
      baseUrl,
      gitlab_token,
      "/issues?scope=assigned_to_me&state=opened&per_page=20&order_by=updated_at"
    ),
  ]);

  const byId = new Map<string, GitItem>();

  reviewMrs.forEach((i) => {
    const mapped = mapMr(i, true);
    byId.set(mapped.id, mapped);
  });
  assignedMrs.forEach((i) => {
    const mapped = mapMr(i);
    if (!byId.has(mapped.id)) byId.set(mapped.id, mapped);
  });
  assignedIssues.forEach((i) => {
    const mapped = mapIssue(i);
    if (!byId.has(mapped.id)) byId.set(mapped.id, mapped);
  });

  return Array.from(byId.values());
};
