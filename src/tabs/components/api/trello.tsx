/**
 * Trello API integration
 * Fetches cards using an API key + token (free for personal accounts).
 *
 * Behavior depends on the saved filter:
 *  - a board is selected -> show cards from that board, optionally limited to
 *    the selected columns (lists).
 *  - no board selected   -> show cards assigned to the member across boards.
 */

import { getTrelloCredentials, getTrelloFilter } from "./storage";
import { TaskItem, PRIORITY } from "./types";

const TRELLO_API = "https://api.trello.com/1";

export interface TrelloBoard {
  id: string;
  name: string;
}

export interface TrelloList {
  id: string;
  name: string;
}

const auth = (key: string, token: string) =>
  `key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`;

const fetchJson = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Map a raw Trello card to a TaskItem, using a list/board name as subtitle. */
const mapCard = (card: any, subtitle: string): TaskItem => {
  const due = card.due ? new Date(card.due) : null;
  const msUntilDue = due ? due.getTime() - Date.now() : null;
  const overdue = msUntilDue !== null && msUntilDue < 0;
  const dueSoon = msUntilDue !== null && msUntilDue >= 0 && msUntilDue <= DAY_MS;

  let priority: number = PRIORITY.NORMAL;
  if (overdue) priority = PRIORITY.URGENT;
  else if (dueSoon) priority = PRIORITY.TIME;
  else if (due) priority = PRIORITY.HIGH;

  return {
    id: card.id,
    title: card.name || "Untitled card",
    url: card.shortUrl || card.url || "",
    subtitle,
    badge: due
      ? `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : undefined,
    badgeClass: overdue ? "status-blocked" : due ? "status-progress" : undefined,
    icon: "📋",
    priority,
  };
};

/**
 * List the member's open boards (for the settings board picker).
 */
export const fetchTrelloBoards = async (): Promise<TrelloBoard[]> => {
  const { trello_key, trello_token } = await getTrelloCredentials();
  if (!trello_key || !trello_token) return [];

  const boards = await fetchJson(
    `${TRELLO_API}/members/me/boards?${auth(trello_key, trello_token)}&fields=name&filter=open`
  );
  if (!Array.isArray(boards)) return [];
  return boards.map((b: any) => ({ id: b.id, name: b.name }));
};

/**
 * List the columns (lists) of a board (for the settings column picker).
 */
export const fetchTrelloLists = async (boardId: string): Promise<TrelloList[]> => {
  const { trello_key, trello_token } = await getTrelloCredentials();
  if (!trello_key || !trello_token || !boardId) return [];

  const lists = await fetchJson(
    `${TRELLO_API}/boards/${boardId}/lists?${auth(trello_key, trello_token)}&fields=name&filter=open`
  );
  if (!Array.isArray(lists)) return [];
  return lists.map((l: any) => ({ id: l.id, name: l.name }));
};

/**
 * Fetch cards to display, honoring the saved board / column filter.
 */
export const fetchTrelloItems = async (): Promise<TaskItem[]> => {
  const { trello_key, trello_token } = await getTrelloCredentials();
  if (!trello_key || !trello_token) return [];

  const credentials = auth(trello_key, trello_token);
  const { boardId, listIds, onlyMine } = await getTrelloFilter();

  // --- Board-scoped mode: cards from a chosen board / columns ---
  if (boardId) {
    const [cards, lists, me] = await Promise.all([
      fetchJson(
        `${TRELLO_API}/boards/${boardId}/cards?${credentials}&filter=open&fields=name,shortUrl,due,idList,idMembers&limit=100`
      ),
      fetchJson(`${TRELLO_API}/boards/${boardId}/lists?${credentials}&fields=name&filter=open`),
      onlyMine ? fetchJson(`${TRELLO_API}/members/me?${credentials}&fields=id`) : null,
    ]);

    if (!Array.isArray(cards)) return [];

    const listNames = new Map<string, string>();
    if (Array.isArray(lists)) {
      lists.forEach((l: any) => listNames.set(l.id, l.name));
    }

    const allowed = new Set(listIds);
    const myId: string | null = me?.id || null;

    return cards
      .filter((card: any) => allowed.size === 0 || allowed.has(card.idList))
      .filter(
        (card: any) =>
          !onlyMine ||
          !myId ||
          (Array.isArray(card.idMembers) && card.idMembers.includes(myId))
      )
      .slice(0, 25)
      .map((card: any) => mapCard(card, listNames.get(card.idList) || ""));
  }

  // --- Default mode: cards assigned to me across boards ---
  const [cards, boards] = await Promise.all([
    fetchJson(
      `${TRELLO_API}/members/me/cards?${credentials}&filter=open&fields=name,shortUrl,due,idBoard&limit=20`
    ),
    fetchJson(`${TRELLO_API}/members/me/boards?${credentials}&fields=name&filter=open`),
  ]);

  if (!Array.isArray(cards)) return [];

  const boardNames = new Map<string, string>();
  if (Array.isArray(boards)) {
    boards.forEach((b: any) => boardNames.set(b.id, b.name));
  }

  return cards.map((card: any) => mapCard(card, boardNames.get(card.idBoard) || ""));
};
