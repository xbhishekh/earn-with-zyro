import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing pending payments...");

    // Find all pending transactions where release_date has passed
    const { data: pendingTxs, error: fetchError } = await supabase
      .from("balance_transactions")
      .select("id, user_id, amount, submission_id, campaign_id, notes")
      .eq("status", "pending")
      .lte("release_date", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching pending transactions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingTxs?.length || 0} transactions ready for release`);

    if (!pendingTxs || pendingTxs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending payments to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group transactions by user for batch notifications
    const userTransactions: Record<string, { total: number; txIds: string[] }> = {};

    for (const tx of pendingTxs) {
      if (!userTransactions[tx.user_id]) {
        userTransactions[tx.user_id] = { total: 0, txIds: [] };
      }
      userTransactions[tx.user_id].total += Number(tx.amount);
      userTransactions[tx.user_id].txIds.push(tx.id);
    }

    // Update all pending transactions to available
    const txIds = pendingTxs.map((tx) => tx.id);
    const { error: updateError } = await supabase
      .from("balance_transactions")
      .update({
        status: "available",
        processed_at: new Date().toISOString(),
      })
      .in("id", txIds);

    if (updateError) {
      console.error("Error updating transactions:", updateError);
      throw updateError;
    }

    console.log(`Updated ${txIds.length} transactions to available`);

    // Process notifications for each user
    for (const [userId, data] of Object.entries(userTransactions)) {
      try {
        // Get username for DM
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("user_id", userId)
          .single();

        const username = profile?.username || profile?.display_name || "Creator";

        // Send Team Zyrozo DM using the SQL function
        const { error: dmError } = await supabase.rpc("send_payment_release_dm", {
          p_user_id: userId,
          p_amount: data.total,
          p_username: username,
        });

        if (dmError) {
          console.error(`Error sending DM to ${userId}:`, dmError);
        } else {
          console.log(`Sent payment DM to ${username} for $${data.total}`);
        }

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "payment_available",
          title: "Payment Released! 💰",
          message: `$${data.total.toFixed(2)} is now available in your balance for withdrawal.`,
          metadata: { amount: data.total, transaction_count: data.txIds.length },
        });
      } catch (notifyError) {
        console.error(`Error notifying user ${userId}:`, notifyError);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Successfully processed pending payments",
        processed: txIds.length,
        users_notified: Object.keys(userTransactions).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing pending payments:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
