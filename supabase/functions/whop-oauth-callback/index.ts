import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Get the frontend URL for redirects
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://creator-sparkle-74.lovable.app";

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return Response.redirect(
        `${frontendUrl}/auth/whop/callback?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || "")}`
      );
    }

    if (!code || !state) {
      console.error("Missing code or state");
      return Response.redirect(
        `${frontendUrl}/auth/whop/callback?error=missing_params`
      );
    }

    console.log("Processing OAuth callback with state:", state);

    // Create admin client for state validation
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate state and get user ID
    const { data: stateData, error: stateError } = await supabaseAdmin
      .from("whop_oauth_states")
      .select("user_id, expires_at")
      .eq("state", state)
      .single();

    if (stateError || !stateData) {
      console.error("Invalid or expired state:", stateError);
      return Response.redirect(
        `${frontendUrl}/auth/whop/callback?error=invalid_state`
      );
    }

    // Check if state has expired
    if (new Date(stateData.expires_at) < new Date()) {
      console.error("State has expired");
      await supabaseAdmin.from("whop_oauth_states").delete().eq("state", state);
      return Response.redirect(
        `${frontendUrl}/auth/whop/callback?error=expired_state`
      );
    }

    const userId = stateData.user_id;
    console.log("Valid state for user:", userId);

    // Delete used state
    await supabaseAdmin.from("whop_oauth_states").delete().eq("state", state);

    // Exchange code for access token
    const clientId = Deno.env.get("WHOP_CLIENT_ID");
    const clientSecret = Deno.env.get("WHOP_CLIENT_SECRET");
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whop-oauth-callback`;

    const tokenResponse = await fetch("https://api.whop.com/api/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errorText);
      return Response.redirect(
        `${frontendUrl}/auth/whop/callback?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("Successfully obtained access token");

    // Fetch user profile from Whop
    const userResponse = await fetch("https://api.whop.com/api/v5/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("Failed to fetch user profile:", userResponse.status, errorText);
      return Response.redirect(
        `${frontendUrl}/auth/whop/callback?error=profile_fetch_failed`
      );
    }

    const whopUser = await userResponse.json();
    console.log("Fetched Whop user profile:", whopUser.id, whopUser.username);

    // Check if user already has a Whop account linked
    const { data: existingAccount } = await supabaseAdmin
      .from("social_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "whop")
      .single();

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabaseAdmin
        .from("social_accounts")
        .update({
          username: whopUser.username || whopUser.name,
          profile_url: `https://whop.com/${whopUser.username || whopUser.id}`,
          whop_user_id: whopUser.id,
          whop_access_token: accessToken,
          status: "verified",
          is_verified: true,
          oauth_verified_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccount.id);

      if (updateError) {
        console.error("Error updating social account:", updateError);
        return Response.redirect(
          `${frontendUrl}/auth/whop/callback?error=update_failed`
        );
      }
    } else {
      // Create new verified account
      const { error: insertError } = await supabaseAdmin
        .from("social_accounts")
        .insert({
          user_id: userId,
          platform: "whop",
          username: whopUser.username || whopUser.name,
          profile_url: `https://whop.com/${whopUser.username || whopUser.id}`,
          whop_user_id: whopUser.id,
          whop_access_token: accessToken,
          status: "verified",
          is_verified: true,
          oauth_verified_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error creating social account:", insertError);
        return Response.redirect(
          `${frontendUrl}/auth/whop/callback?error=insert_failed`
        );
      }
    }

    console.log("Successfully verified Whop account for user:", userId);

    // Redirect to success page
    return Response.redirect(
      `${frontendUrl}/auth/whop/callback?success=true&username=${encodeURIComponent(whopUser.username || whopUser.name || "")}`
    );
  } catch (error) {
    console.error("Error in whop-oauth-callback:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://creator-sparkle-74.lovable.app";
    return Response.redirect(
      `${frontendUrl}/auth/whop/callback?error=internal_error`
    );
  }
});
