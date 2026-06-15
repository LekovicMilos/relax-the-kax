/**
 * Unified feed model.
 * Maps each integration's items into a common shape so they can be shown
 * together in the "My Day" view.
 */

import { JiraTicket } from "./jira";
import { GitItem } from "./github";
import { TaskItem, TaskBadgeClass, PRIORITY } from "./types";
import { CalendarEvent } from "./calendar";

export type FeedSource =
  | "jira"
  | "github"
  | "gitlab"
  | "trello"
  | "notion"
  | "linear"
  | "calendar";

export interface FeedItem {
  id: string;
  source: FeedSource;
  title: string;
  url: string;
  meta?: string; // key / repo#num / identifier / board / time
  badge?: string; // status label
  badgeClass?: TaskBadgeClass;
  /** Normalized priority, 0 = most urgent. Used to sort the My Day feed. */
  priority: number;
}

/** Fallback priority derived from a status badge class. */
const priorityFromBadge = (badgeClass?: TaskBadgeClass): number => {
  switch (badgeClass) {
    case "status-blocked":
      return PRIORITY.URGENT;
    case "status-progress":
      return PRIORITY.ACTIVE;
    case "status-done":
      return PRIORITY.DONE;
    case "status-todo":
      return PRIORITY.NORMAL;
    default:
      return PRIORITY.NORMAL;
  }
};

// ---------------------------------------------
// Per-service mappers
// ---------------------------------------------

const jiraBadgeClass = (ticket: JiraTicket): TaskBadgeClass => {
  const status = ticket.status.toLowerCase();
  const category = ticket.statusCategory?.toLowerCase() || "";
  if (category === "done" || status === "done") return "status-done";
  if (status === "blocked") return "status-blocked";
  if (category === "in progress" || status.includes("progress") || status.includes("review"))
    return "status-progress";
  return "status-todo";
};

const jiraPriority = (ticket: JiraTicket, badgeClass: TaskBadgeClass): number => {
  if (badgeClass === "status-blocked") return PRIORITY.URGENT;
  if (badgeClass === "status-done") return PRIORITY.DONE;
  switch ((ticket.priority || "").toLowerCase()) {
    case "highest":
      return PRIORITY.URGENT;
    case "high":
      return PRIORITY.HIGH;
    case "medium":
      return PRIORITY.ACTIVE;
    case "low":
      return PRIORITY.NORMAL;
    case "lowest":
      return PRIORITY.LOW;
    default:
      return badgeClass === "status-progress" ? PRIORITY.ACTIVE : PRIORITY.NORMAL;
  }
};

export const jiraToFeed = (tickets: JiraTicket[]): FeedItem[] =>
  tickets.map((t) => {
    const badgeClass = jiraBadgeClass(t);
    return {
      id: `jira-${t.id}`,
      source: "jira",
      title: t.summary,
      url: t.url,
      meta: t.key,
      badge: t.status,
      badgeClass,
      priority: jiraPriority(t, badgeClass),
    };
  });

export const gitToFeed = (
  items: GitItem[],
  source: "github" | "gitlab"
): FeedItem[] =>
  items.map((i) => {
    const ref = i.type === "issue" ? "#" : "!";
    const symbol = source === "github" ? "#" : ref;
    return {
      id: `${source}-${i.id}`,
      source,
      title: i.title,
      url: i.url,
      meta: `${i.repo}${i.number ? ` ${symbol}${i.number}` : ""}`,
      badge: i.draft
        ? "Draft"
        : i.reviewRequested
        ? "Review requested"
        : i.type === "issue"
        ? "Issue"
        : source === "github"
        ? "Pull request"
        : "Merge request",
      badgeClass: i.draft ? "status-todo" : "status-progress",
      // Someone waiting on your review is the most time-sensitive; drafts lowest.
      priority: i.reviewRequested
        ? PRIORITY.TIME
        : i.draft
        ? PRIORITY.LOW
        : PRIORITY.ACTIVE,
    };
  });

export const taskToFeed = (
  items: TaskItem[],
  source: "trello" | "notion" | "linear"
): FeedItem[] =>
  items.map((i) => ({
    id: `${source}-${i.id}`,
    source,
    title: i.title,
    url: i.url,
    meta: i.subtitle,
    badge: i.badge,
    badgeClass: i.badgeClass,
    // Notion surfaces reference pages rather than tasks, so rank them low.
    priority:
      i.priority ??
      (source === "notion" ? PRIORITY.LOW : priorityFromBadge(i.badgeClass)),
  }));

const formatEventTime = (event: CalendarEvent): string => {
  if (event.isAllDay) return "All day";
  return event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const calendarToFeed = (events: CalendarEvent[]): FeedItem[] =>
  events.map((e) => {
    // A timed event that hasn't started yet is the most time-sensitive item;
    // ongoing/all-day events rank just below.
    const upcoming = !e.isAllDay && e.start.getTime() > Date.now();
    return {
      id: `calendar-${e.id}`,
      source: "calendar",
      title: e.summary,
      url: e.conferenceLink || e.htmlLink,
      meta: formatEventTime(e),
      badge: e.location,
      badgeClass: "status-progress",
      priority: upcoming ? PRIORITY.URGENT : PRIORITY.TIME,
    };
  });

/**
 * Sort the unified feed by priority (most urgent first). Stable, so items that
 * share a priority keep their incoming order (e.g. calendar events stay in
 * start-time order, and per-service grouping is preserved within a tier).
 */
export const sortFeed = (items: FeedItem[]): FeedItem[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.priority - b.item.priority || a.index - b.index)
    .map(({ item }) => item);
