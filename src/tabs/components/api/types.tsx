/**
 * Shared item model for service panels (Trello, Notion, Linear, ...).
 * Keeps the display component generic across integrations.
 */

export type TaskBadgeClass =
  | "status-progress"
  | "status-todo"
  | "status-done"
  | "status-blocked";

/**
 * Shared, normalized priority scale used to sort the unified "My Day" feed.
 * Lower number sorts first (more urgent).
 */
export const PRIORITY = {
  URGENT: 0, // blocked / overdue / urgent
  TIME: 1, // time-sensitive (today's meetings) / review requested
  HIGH: 2,
  ACTIVE: 3, // in progress / started / normal open work
  NORMAL: 4,
  LOW: 5,
  DONE: 6,
} as const;

export interface TaskItem {
  id: string;
  title: string;
  url: string;
  subtitle?: string; // board / project / identifier
  badge?: string; // status label
  badgeClass?: TaskBadgeClass;
  icon?: string; // emoji prefix
  /**
   * Normalized priority, 0 = most urgent … 6 = lowest.
   * Used to sort the unified "My Day" feed across services.
   */
  priority?: number;
}
