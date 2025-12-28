import { useSubscription } from "./useSubscription";

const PREMIUM_REFRESH_INTERVAL = 10000; // 10 seconds
const FREE_REFRESH_INTERVAL = 30000; // 30 seconds

export function useRefreshInterval() {
  const { hasPlusAccess, isLoading } = useSubscription();

  const refreshInterval = hasPlusAccess
    ? PREMIUM_REFRESH_INTERVAL
    : FREE_REFRESH_INTERVAL;
  const refreshSeconds = refreshInterval / 1000;

  return { refreshInterval, refreshSeconds, isLoading };
}
