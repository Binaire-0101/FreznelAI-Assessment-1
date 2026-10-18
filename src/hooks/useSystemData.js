import { useEffect, useState } from "react";
import { monitoringSnapShot } from "../api/api";

const useSystemData = (pollInterval = 2000) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let isFirstLoad = true;

    const fetchData = async () => {
      try {
        const res = await monitoringSnapShot();
        if (!alive) return;

        setData(res.data);
        setError(null);
      } catch (err) {
        if (!alive) return;
        setError(err?.message ?? String(err));
      } finally {
        if (alive && isFirstLoad) {
          isFirstLoad = false;
          setIsLoading(false);
        }
      }
    };

    fetchData(); // Initial fetch

    // Poll every 2 seconds for live updates
    const intervalId = setInterval(fetchData, pollInterval);

    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, [pollInterval]);

  return { data, error, isLoading };
};

export default useSystemData;
