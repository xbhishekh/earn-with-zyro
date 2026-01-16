import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AdminAccessData {
  myCampaignIds: string[];
  myCampaignMemberUserIds: string[];
  hasFullAccess: boolean;
  loading: boolean;
}

export const useAdminAccess = () => {
  const { user, isSuperAdmin, isOwner, isFounder } = useAuth();
  const [data, setData] = useState<AdminAccessData>({
    myCampaignIds: [],
    myCampaignMemberUserIds: [],
    hasFullAccess: false,
    loading: true,
  });

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

    try {
      // Normal admin: Get campaigns I created
      const { data: myCampaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("created_by", user.id);

      if (campaignsError) throw campaignsError;

      const myCampaignIds = (myCampaigns || []).map(c => c.id);

      if (myCampaignIds.length === 0) {
        setData({ myCampaignIds: [], myCampaignMemberUserIds: [], hasFullAccess: false, loading: false });
        return;
      }

      // Get all users who joined my campaigns
      const { data: myMembers, error: membersError } = await supabase
        .from("campaign_members")
        .select("user_id")
        .in("campaign_id", myCampaignIds);

      if (membersError) throw membersError;

      const myCampaignMemberUserIds = [...new Set((myMembers || []).map(m => m.user_id))];

      setData({
        myCampaignIds,
        myCampaignMemberUserIds,
        hasFullAccess: false,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching admin access data:", error);
      setData({ myCampaignIds: [], myCampaignMemberUserIds: [], hasFullAccess: false, loading: false });
    }
  }, [user, isSuperAdmin, isOwner, isFounder]);

  useEffect(() => {
    fetchAccessData();
  }, [fetchAccessData]);

  return {
    ...data,
    refetch: fetchAccessData,
  };
};

export default useAdminAccess;
