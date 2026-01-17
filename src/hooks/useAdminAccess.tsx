import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AdminAccessData {
  myCampaignIds: string[];
  myCampaignMemberUserIds: string[];
  hasFullAccess: boolean;
  loading: boolean;
}

// Cache to prevent redundant fetches
const accessCache = new Map<string, { data: AdminAccessData; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export const useAdminAccess = () => {
  const { user, isSuperAdmin, isOwner, isFounder } = useAuth();
  const [data, setData] = useState<AdminAccessData>({
    myCampaignIds: [],
    myCampaignMemberUserIds: [],
    hasFullAccess: false,
    loading: true,
  });
  const isFetching = useRef(false);

  const fetchAccessData = useCallback(async () => {
    if (!user) {
      setData({ myCampaignIds: [], myCampaignMemberUserIds: [], hasFullAccess: false, loading: false });
      return;
    }

    const hasFullAccess = isSuperAdmin || isOwner || isFounder;

    if (hasFullAccess) {
      setData({ myCampaignIds: [], myCampaignMemberUserIds: [], hasFullAccess: true, loading: false });
      return;
    }

    // Check cache
    const cacheKey = `admin_access_${user.id}`;
    const cached = accessCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      return;
    }

    // Prevent duplicate concurrent requests
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      // Normal admin: Get campaigns I created OR am assigned to
      const [createdRes, assignedRes] = await Promise.all([
        supabase.from("campaigns").select("id").eq("created_by", user.id),
        supabase.from("admin_campaign_assignments").select("campaign_id").eq("admin_user_id", user.id)
      ]);

      if (createdRes.error) throw createdRes.error;
      
      const createdIds = (createdRes.data || []).map(c => c.id);
      const assignedIds = (assignedRes.data || []).map(a => a.campaign_id);
      const myCampaignIds = [...new Set([...createdIds, ...assignedIds])];

      if (myCampaignIds.length === 0) {
        const result = { myCampaignIds: [], myCampaignMemberUserIds: [], hasFullAccess: false, loading: false };
        accessCache.set(cacheKey, { data: result, timestamp: Date.now() });
        setData(result);
        return;
      }

      // Get all users who joined my campaigns
      const { data: myMembers, error: membersError } = await supabase
        .from("campaign_members")
        .select("user_id")
        .in("campaign_id", myCampaignIds);

      if (membersError) throw membersError;

      const myCampaignMemberUserIds = [...new Set((myMembers || []).map(m => m.user_id))];

      const result: AdminAccessData = {
        myCampaignIds,
        myCampaignMemberUserIds,
        hasFullAccess: false,
        loading: false,
      };

      accessCache.set(cacheKey, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (error) {
      console.error("Error fetching admin access data:", error);
      setData({ myCampaignIds: [], myCampaignMemberUserIds: [], hasFullAccess: false, loading: false });
    } finally {
      isFetching.current = false;
    }
  }, [user?.id, isSuperAdmin, isOwner, isFounder]);

  useEffect(() => {
    fetchAccessData();
  }, [fetchAccessData]);

  // Memoize returned arrays to prevent unnecessary re-renders in consumers
  const memoizedCampaignIds = useMemo(() => data.myCampaignIds, [JSON.stringify(data.myCampaignIds)]);
  const memoizedMemberUserIds = useMemo(() => data.myCampaignMemberUserIds, [JSON.stringify(data.myCampaignMemberUserIds)]);

  return useMemo(() => ({
    myCampaignIds: memoizedCampaignIds,
    myCampaignMemberUserIds: memoizedMemberUserIds,
    hasFullAccess: data.hasFullAccess,
    loading: data.loading,
    refetch: fetchAccessData,
  }), [memoizedCampaignIds, memoizedMemberUserIds, data.hasFullAccess, data.loading, fetchAccessData]);
};

export default useAdminAccess;
