import { useState, useEffect, useCallback } from "react";
import { fetchGithubItems, GitItem } from "../api/github";
import { hasGithubCredentials } from "../api/storage";

interface UseGithubReturn {
  items: GitItem[];
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  refetch: () => void;
}

/**
 * Hook for fetching and managing GitHub PRs / issues
 */
function useGithub(): UseGithubReturn {
  const [items, setItems] = useState<GitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const configured = await hasGithubCredentials();
      setIsConfigured(configured);

      if (!configured) {
        setLoading(false);
        return;
      }

      const results = await fetchGithubItems();
      setItems(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch from GitHub");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, isConfigured, refetch: fetchData };
}

export default useGithub;
