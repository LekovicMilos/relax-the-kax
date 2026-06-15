import { useState, useEffect, useCallback } from "react";
import { TaskItem } from "../api/types";

interface UseServiceItemsReturn {
  items: TaskItem[];
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  refetch: () => void;
}

/**
 * Generic hook for service panels that show a list of task items
 * (Trello cards, Notion pages, Linear issues, ...).
 *
 * @param fetchItems  fetches the items once credentials are present
 * @param hasCreds    resolves true when the service is configured
 * @param label       service name used in the fallback error message
 */
function useServiceItems(
  fetchItems: () => Promise<TaskItem[]>,
  hasCreds: () => Promise<boolean>,
  label: string
): UseServiceItemsReturn {
  const [items, setItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const configured = await hasCreds();
      setIsConfigured(configured);

      if (!configured) {
        setLoading(false);
        return;
      }

      const results = await fetchItems();
      setItems(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to fetch from ${label}`);
    } finally {
      setLoading(false);
    }
  }, [fetchItems, hasCreds, label]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, isConfigured, refetch: fetchData };
}

export default useServiceItems;
