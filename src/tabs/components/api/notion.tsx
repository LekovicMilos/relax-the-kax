/**
 * Notion API integration
 * Lists the most recently edited pages shared with the integration via the
 * Search endpoint. Notion's API is free.
 *
 * Note: Notion has no universal "assigned to me" concept across arbitrary
 * databases, so we surface recently edited pages the integration can access.
 */

import { getNotionCredentials } from "./storage";
import { TaskItem } from "./types";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
});

/** Extract a readable title from a page object's properties. */
const getPageTitle = (page: any): string => {
  const props = page.properties || {};
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop?.type === "title" && Array.isArray(prop.title)) {
      const text = prop.title.map((t: any) => t.plain_text).join("").trim();
      if (text) return text;
    }
  }
  return "Untitled";
};

/**
 * Fetch recently edited pages accessible to the integration.
 */
export const fetchNotionItems = async (): Promise<TaskItem[]> => {
  const { notion_token } = await getNotionCredentials();
  if (!notion_token) return [];

  try {
    const response = await fetch(`${NOTION_API}/search`, {
      method: "POST",
      headers: getHeaders(notion_token),
      body: JSON.stringify({
        filter: { property: "object", value: "page" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: 20,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];

    return results.map((page: any): TaskItem => {
      const edited = page.last_edited_time ? new Date(page.last_edited_time) : null;
      return {
        id: page.id,
        title: getPageTitle(page),
        url: page.url || "",
        subtitle: edited
          ? `Edited ${edited.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
          : "",
        icon: page.icon?.type === "emoji" ? page.icon.emoji : "📝",
      };
    });
  } catch {
    return [];
  }
};
