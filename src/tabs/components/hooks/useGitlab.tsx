import { useState, useEffect, useCallback } from "react";
import { fetchGitlabItems } from "../api/gitlab";
import { GitItem } from "../api/github";
import { hasGitlabCredentials } from "../api/storage";

interface UseGitlabReturn {
  items: GitItem[];
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  refetch: () => void;
}

/**
 * Hook for fetching and managing GitLab MRs / issues
 */
function useGitlab(): UseGitlabReturn {
  const [items, setItems] = useState<GitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const configured = await hasGitlabCredentials();
      setIsConfigured(configured);

      if (!configured) {
        setLoading(false);
        return;
      }

      const results = await fetchGitlabItems();
      setItems(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch from GitLab");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, isConfigured, refetch: fetchData };
}

export default useGitlab;
