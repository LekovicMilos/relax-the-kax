import { useState, useEffect, useCallback } from "react";
import {
  CalendarEvent,
  fetchTodayEvents,
  isGoogleAuthenticated,
  authenticateGoogle,
  signOutGoogle,
} from "../api/calendar";

interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refetch: () => void;
}

/**
 * Hook for fetching and managing Google Calendar events
 */
function useCalendar(): UseCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const authenticated = await isGoogleAuthenticated();
      setIsAuthenticated(authenticated);

      if (!authenticated) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const todayEvents = await fetchTodayEvents();
      setEvents(todayEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await authenticateGoogle();
      if (success) {
        setIsAuthenticated(true);
        await fetchData();
      } else {
        setError("Failed to connect to Google Calendar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const disconnect = useCallback(async () => {
    await signOutGoogle();
    setIsAuthenticated(false);
    setEvents([]);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchData]);

  return {
    events,
    loading,
    error,
    isAuthenticated,
    connect,
    disconnect,
    refetch: fetchData,
  };
}

export default useCalendar;
