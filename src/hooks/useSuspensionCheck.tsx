import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Suspension {
  id: string;
  reason: string | null;
  suspended_at: string;
  campaign_id: string | null;
}

// Cache suspension checks to avoid duplicate API calls
const suspensionCache = new Map<string, { data: Suspension | null; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

export const useSuspensionCheck = () => {
  const { user } = useAuth();
  const [globalSuspension, setGlobalSuspension] = useState<Suspension | null>(null);
  const [loading, setLoading] = useState(true);
  const isFetching = useRef(false);

  const checkGlobalSuspension = useCallback(async () => {
    if (!user) {
      setGlobalSuspension(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = `global_${user.id}`;
    const cached = suspensionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setGlobalSuspension(cached.data);
      setLoading(false);
      return;
    }

    // Prevent duplicate concurrent requests
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const { data, error } = await supabase
        .from("user_suspensions")
        .select("id, reason, suspended_at, campaign_id")
        .eq("user_id", user.id)
        .is("campaign_id", null)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      
      // Update cache
      suspensionCache.set(cacheKey, { data, timestamp: Date.now() });
      setGlobalSuspension(data);
    } catch (error) {
      console.error("Error checking suspension:", error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [user]);

  const checkCampaignBan = useCallback(async (campaignId: string): Promise<Suspension | null> => {
    if (!user) return null;

    // Check cache first
    const cacheKey = `campaign_${user.id}_${campaignId}`;
    const cached = suspensionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from("user_suspensions")
        .select("id, reason, suspended_at, campaign_id")
        .eq("user_id", user.id)
        .eq("campaign_id", campaignId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      
      // Update cache
      suspensionCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error("Error checking campaign ban:", error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    checkGlobalSuspension();
  }, [checkGlobalSuspension]);

  return {
    globalSuspension,
    loading,
    checkGlobalSuspension,
    checkCampaignBan,
    isGloballySuspended: !!globalSuspension,
  };
};
