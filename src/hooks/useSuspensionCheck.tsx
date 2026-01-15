import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Suspension {
  id: string;
  reason: string | null;
  suspended_at: string;
  campaign_id: string | null;
}

export const useSuspensionCheck = () => {
  const { user } = useAuth();
  const [globalSuspension, setGlobalSuspension] = useState<Suspension | null>(null);
  const [loading, setLoading] = useState(true);

  const checkGlobalSuspension = useCallback(async () => {
    if (!user) {
      setGlobalSuspension(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_suspensions")
        .select("id, reason, suspended_at, campaign_id")
        .eq("user_id", user.id)
        .is("campaign_id", null) // Global suspension
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      setGlobalSuspension(data);
    } catch (error) {
      console.error("Error checking suspension:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkCampaignBan = useCallback(async (campaignId: string): Promise<Suspension | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("user_suspensions")
        .select("id, reason, suspended_at, campaign_id")
        .eq("user_id", user.id)
        .eq("campaign_id", campaignId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
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
