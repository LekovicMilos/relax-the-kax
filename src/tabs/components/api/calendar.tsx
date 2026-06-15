/**
 * Google Calendar API integration
 * Handles OAuth2 authentication and event fetching from Google Calendar
 */

// ============================================
// Types
// ============================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  htmlLink: string;
  isAllDay: boolean;
  colorId?: string;
  conferenceLink?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  htmlLink: string;
  colorId?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
}

// ============================================
// Internal Helpers
// ============================================

/**
 * Get OAuth2 token from Chrome Identity API, capturing any error message.
 */
const getAuthTokenDetailed = (
  interactive: boolean = false
): Promise<{ token: string | null; error?: string }> => {
  return new Promise((resolve) => {
    if (!chrome.identity?.getAuthToken) {
      resolve({ token: null, error: "Chrome identity API is unavailable" });
      return;
    }
    try {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          resolve({ token: null, error: chrome.runtime.lastError.message });
        } else {
          resolve({ token: token || null });
        }
      });
    } catch (e) {
      resolve({
        token: null,
        error: e instanceof Error ? e.message : "Failed to start Google sign-in",
      });
    }
  });
};

/**
 * Get OAuth2 token from Chrome Identity API
 */
const getAuthToken = async (interactive: boolean = false): Promise<string | null> => {
  const { token } = await getAuthTokenDetailed(interactive);
  return token;
};

/**
 * Remove cached auth token (for logout or token refresh)
 */
export const removeCachedAuthToken = async (): Promise<void> => {
  const token = await getAuthToken(false);
  if (token) {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => {
        resolve();
      });
    });
  }
};

/**
 * Convert Google Calendar event to our CalendarEvent type
 */
const mapEventToCalendarEvent = (event: GoogleCalendarEvent): CalendarEvent => {
  const isAllDay = !event.start.dateTime;
  const start = new Date(event.start.dateTime || event.start.date || "");
  const end = new Date(event.end.dateTime || event.end.date || "");

  // Extract video conference link if available
  let conferenceLink: string | undefined;
  if (event.conferenceData?.entryPoints) {
    const videoEntry = event.conferenceData.entryPoints.find(
      (ep) => ep.entryPointType === "video"
    );
    conferenceLink = videoEntry?.uri;
  }

  return {
    id: event.id,
    summary: event.summary || "No title",
    description: event.description,
    start,
    end,
    location: event.location,
    htmlLink: event.htmlLink,
    isAllDay,
    colorId: event.colorId,
    conferenceLink,
  };
};

// ============================================
// Public API
// ============================================

/**
 * Check if user is authenticated with Google
 */
export const isGoogleAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken(false);
  return token !== null;
};

/**
 * Authenticate with Google (shows consent screen if needed).
 * Returns the underlying error message when the sign-in could not complete,
 * so the UI can tell the user what went wrong instead of failing silently.
 */
export const authenticateGoogle = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  const { token, error } = await getAuthTokenDetailed(true);
  return { success: token !== null, error };
};

/**
 * Sign out from Google Calendar.
 * Revokes the OAuth grant at Google first, then clears Chrome's token cache.
 * Without the revoke, Chrome would silently re-issue a token on the next
 * non-interactive getAuthToken call because the grant is still active.
 */
export const signOutGoogle = async (): Promise<void> => {
  const token = await getAuthToken(false);
  if (!token) return;

  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  } catch {
    // Even if revoke fails (network), still clear local cache below.
  }

  await new Promise<void>((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });
};

/**
 * Fetch today's upcoming events from primary calendar
 */
export const fetchTodayEvents = async (): Promise<CalendarEvent[]> => {
  const token = await getAuthToken(false);
  if (!token) {
    return [];
  }

  try {
    // Get start and end of today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const params = new URLSearchParams({
      timeMin: startOfToday.toISOString(),
      timeMax: endOfToday.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "10",
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 401) {
      // Token expired, remove it and return empty
      await removeCachedAuthToken();
      return [];
    }

    if (!response.ok) {
      // Silent fail - API error handling without logging
      return [];
    }

    const data = await response.json();
    const events = (data.items || []) as GoogleCalendarEvent[];

    // Filter to only show upcoming events (not past ones)
    const upcomingEvents = events
      .map(mapEventToCalendarEvent)
      .filter((event) => {
        // For all-day events, show all of today's events
        if (event.isAllDay) return true;
        // For timed events, only show if they haven't ended yet
        return event.end > now;
      });

    return upcomingEvents;
  } catch {
    // Silent fail - network or parsing error
    return [];
  }
};
