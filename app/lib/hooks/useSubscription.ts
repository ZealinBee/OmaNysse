"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/app/lib/supabase/auth-context";

const CACHE_KEY = "seuraavabussi_subscription_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface Subscription {
  type: "monthly" | "lifetime";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface CachedSubscription {
  subscription: Subscription | null;
  hasPlusAccess: boolean;
  userId: string;
  timestamp: number;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  hasPlusAccess: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Get initial state from cache synchronously - this runs before any useEffect
// For subscribed users with valid cache, this allows instant rendering without waiting for auth
function getInitialStateFromCache(): { hasPlusAccess: boolean; subscription: Subscription | null; initialized: boolean } {
  if (typeof window === "undefined") return { hasPlusAccess: false, subscription: null, initialized: false };
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return { hasPlusAccess: false, subscription: null, initialized: false };
    const parsed: CachedSubscription = JSON.parse(cached);
    // Only use cache if not expired (don't check userId yet - we just want fast initial render)
    if (Date.now() - parsed.timestamp < CACHE_TTL) {
      return { hasPlusAccess: parsed.hasPlusAccess, subscription: parsed.subscription, initialized: true };
    }
  } catch {
    // Ignore errors
  }
  return { hasPlusAccess: false, subscription: null, initialized: false };
}

function getCache(userId: string): CachedSubscription | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed: CachedSubscription = JSON.parse(cached);
    // Check if cache is for the same user and not expired
    if (parsed.userId === userId && Date.now() - parsed.timestamp < CACHE_TTL) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function setCache(userId: string, subscription: Subscription | null, hasPlusAccess: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const cache: CachedSubscription = {
      subscription,
      hasPlusAccess,
      userId,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage errors
  }
}

function clearCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, loading: authLoading } = useAuth();

  // Initialize from cache SYNCHRONOUSLY - no waiting for auth
  // This is critical for instant radar opening for subscribed users
  const initialState = useMemo(() => getInitialStateFromCache(), []);

  const [subscription, setSubscription] = useState<Subscription | null>(initialState.subscription);
  const [hasPlusAccess, setHasPlusAccess] = useState(initialState.hasPlusAccess);
  // If we have valid cache with hasPlusAccess, start with isLoading=false for instant render
  const [isLoading, setIsLoading] = useState(!initialState.initialized || !initialState.hasPlusAccess);
  const [error, setError] = useState<string | null>(null);
  const initializedFromCache = useRef(initialState.initialized);

  // Re-validate cache with user ID once auth loads (in case different user)
  useEffect(() => {
    if (user && initializedFromCache.current) {
      // Check if cached data matches current user
      const cached = getCache(user.id);
      if (!cached) {
        // Cache was for different user, reset and refetch
        initializedFromCache.current = false;
        setIsLoading(true);
      }
    }
    if (!user && !authLoading) {
      // User logged out
      initializedFromCache.current = false;
      setSubscription(null);
      setHasPlusAccess(false);
    }
  }, [user, authLoading]);

  const fetchSubscription = useCallback(async (background = false) => {
    if (!user) {
      setSubscription(null);
      setHasPlusAccess(false);
      setIsLoading(false);
      clearCache();
      return;
    }

    // Only show loading if not a background fetch and no cache
    if (!background && !initializedFromCache.current) {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/stripe/subscription-status");
      const data = await response.json();

      setSubscription(data.subscription);
      setHasPlusAccess(data.hasPlusAccess);
      setCache(user.id, data.subscription, data.hasPlusAccess);
      setError(null);
    } catch (err) {
      // Only set error if we don't have cached data
      if (!initializedFromCache.current) {
        setError("Tilauksen tilan haku epäonnistui");
      }
      console.error("Subscription fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      // Fetch in background if we have cache, otherwise fetch normally
      const cached = getCache(user.id);
      fetchSubscription(!!cached);
    } else if (!authLoading && !user) {
      setSubscription(null);
      setHasPlusAccess(false);
      setIsLoading(false);
      clearCache();
    }
  }, [authLoading, user, fetchSubscription]);

  return {
    subscription,
    hasPlusAccess,
    // For subscribed users with valid cache, don't wait for auth - render instantly
    isLoading: initializedFromCache.current && hasPlusAccess ? isLoading : authLoading || isLoading,
    error,
    refetch: () => fetchSubscription(false),
  };
}
