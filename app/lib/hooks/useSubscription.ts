"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasPlusAccess, setHasPlusAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedFromCache = useRef(false);

  // Initialize from cache immediately
  useEffect(() => {
    if (user && !initializedFromCache.current) {
      const cached = getCache(user.id);
      if (cached) {
        setSubscription(cached.subscription);
        setHasPlusAccess(cached.hasPlusAccess);
        setIsLoading(false);
        initializedFromCache.current = true;
      }
    }
    if (!user) {
      initializedFromCache.current = false;
    }
  }, [user]);

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
    isLoading: authLoading || isLoading,
    error,
    refetch: () => fetchSubscription(false),
  };
}
