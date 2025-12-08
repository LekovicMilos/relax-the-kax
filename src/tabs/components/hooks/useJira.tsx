import { useState, useEffect, useCallback } from "react";
import { fetchInProgressTickets, fetchToDoTickets, getJiraUserName, JiraTicket } from "../api/jira";
import { hasJiraCredentials } from "../api/storage";

interface UseJiraReturn {
  tickets: JiraTicket[];
  todoTickets: JiraTicket[];
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  userName: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching and managing Jira tickets
 */
function useJira(): UseJiraReturn {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [todoTickets, setTodoTickets] = useState<JiraTicket[]>([]);
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

      // Fetch all data in parallel
      const [name, inProgress, toDo] = await Promise.all([
        getJiraUserName(),
        fetchInProgressTickets(),
        fetchToDoTickets(),
      ]);

      setUserName(name);
      setTickets(inProgress);
      setTodoTickets(toDo);
      
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
    todoTickets,
    loading,
    error,
    isConfigured,
    userName,
    refetch: fetchData,
  };
}

export default useJira;
