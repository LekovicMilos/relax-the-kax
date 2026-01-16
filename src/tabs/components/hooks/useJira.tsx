import { useState, useEffect, useCallback } from "react";
import { fetchTicketsByPreferences, JiraTicket } from "../api/jira";
import { hasJiraCredentials } from "../api/storage";

interface UseJiraReturn {
  tickets: JiraTicket[];
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
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

      const ticketResults = await fetchTicketsByPreferences();
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
    refetch: fetchData,
  };
}

export default useJira;
