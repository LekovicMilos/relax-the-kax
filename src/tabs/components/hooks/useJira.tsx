import { useState, useEffect, useCallback } from "react";
import { fetchTicketsByPreferences, getJiraUserName, JiraTicket } from "../api/jira";
import { hasJiraCredentials } from "../api/storage";

interface UseJiraReturn {
  tickets: JiraTicket[];
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  userName: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching and managing Jira tickets
 * Uses user's status preferences to filter tickets
 */
function useJira(): UseJiraReturn {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const configured = await hasJiraCredentials();
      setIsConfigured(configured);
      
      if (!configured) {
        setLoading(false);
        return;
      }

      // Fetch user name and tickets based on preferences
      const [name, ticketResults] = await Promise.all([
        getJiraUserName(),
        fetchTicketsByPreferences(),
      ]);

      setUserName(name);
      setTickets(ticketResults);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    tickets,
    loading,
    error,
    isConfigured,
    userName,
    refetch: fetchData,
  };
}

export default useJira;
