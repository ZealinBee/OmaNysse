"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/lib/supabase/auth-context";

interface Subscription {
  type: "monthly" | "lifetime";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  hasPlusAccess: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasPlusAccess, setHasPlusAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setHasPlusAccess(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/stripe/subscription-status");
      const data = await response.json();

      setSubscription(data.subscription);
      setHasPlusAccess(data.hasPlusAccess);
      setError(null);
    } catch (err) {
      setError("Tilauksen tilan haku epäonnistui");
      console.error("Subscription fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  return {
    subscription,
    hasPlusAccess,
    isLoading: authLoading || isLoading,
    error,
    refetch: fetchSubscription,
  };
}
