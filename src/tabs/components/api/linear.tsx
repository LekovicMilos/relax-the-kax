/**
 * Linear API integration
 * Fetches the issues assigned to the authenticated user via the GraphQL API,
 * using a personal API key. Linear's API is free, including on the free plan.
 */

import { getLinearCredentials } from "./storage";
import { TaskItem, TaskBadgeClass, PRIORITY } from "./types";

const LINEAR_API = "https://api.linear.app/graphql";

const QUERY = `
  query AssignedIssues {
    viewer {
      assignedIssues(
        first: 20
        filter: { state: { type: { nin: ["completed", "canceled"] } } }
        orderBy: updatedAt
      ) {
        nodes {
          id
          identifier
          title
          url
          priority
          state { name type }
        }
      }
    }
  }
`;

const mapStateClass = (type: string): TaskBadgeClass => {
  switch (type) {
    case "started":
      return "status-progress";
    case "completed":
      return "status-done";
    case "canceled":
      return "status-blocked";
    default:
      return "status-todo"; // backlog, unstarted, triage
  }
};

/**
 * Map Linear's priority (0 None, 1 Urgent, 2 High, 3 Medium, 4 Low) and state
 * onto the shared normalized priority scale.
 */
const mapPriority = (linearPriority: number, stateType: string): number => {
  switch (linearPriority) {
    case 1:
      return PRIORITY.URGENT;
    case 2:
      return PRIORITY.HIGH;
    case 3:
      return PRIORITY.ACTIVE;
    case 4:
      return PRIORITY.LOW;
    default:
      // No priority set: rank started work above untouched backlog.
      return stateType === "started" ? PRIORITY.ACTIVE : PRIORITY.NORMAL;
  }
};

/**
 * Fetch issues assigned to the current Linear user.
 */
export const fetchLinearItems = async (): Promise<TaskItem[]> => {
  const { linear_token } = await getLinearCredentials();
  if (!linear_token) return [];

  try {
    const response = await fetch(LINEAR_API, {
      method: "POST",
      headers: {
        Authorization: linear_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const nodes = data?.data?.viewer?.assignedIssues?.nodes;
    if (!Array.isArray(nodes)) return [];

    return nodes.map((issue: any): TaskItem => {
      const stateType = issue.state?.type || "";
      return {
        id: issue.id,
        title: issue.title || "Untitled",
        url: issue.url || "",
        subtitle: issue.identifier || "",
        badge: issue.state?.name,
        badgeClass: mapStateClass(stateType),
        icon: "📐",
        priority: mapPriority(issue.priority ?? 0, stateType),
      };
    });
  } catch {
    return [];
  }
};
