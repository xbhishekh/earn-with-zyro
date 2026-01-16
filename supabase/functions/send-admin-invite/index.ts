import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  invite_code: string;
  invite_type: string;
  expires_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isAdmin = roleData?.role && ["normal_admin", "admin", "super_admin", "owner"].includes(roleData.role);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, invite_code, invite_type, expires_at }: InviteEmailRequest = await req.json();

    if (!email || !invite_code) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiryDate = new Date(expires_at).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const roleLabel = invite_type === "super_admin" 
      ? "Super Admin" 
      : invite_type === "admin" 
        ? "Admin" 
        : "Normal Admin";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation - Zyrozo</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse;">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ff6b35, #f7c59f); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">⚡</span>
                </div>
                <span style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #ff6b35, #f7c59f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Zyrozo</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(145deg, #1a1a1a, #0d0d0d); border-radius: 16px; padding: 40px 32px; border: 1px solid #2a2a2a;">
              <!-- Badge -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background: linear-gradient(135deg, #ff6b35, #f7c59f); color: #000; font-size: 12px; font-weight: 600; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                  🎉 You're Invited!
                </span>
              </div>
              
              <!-- Title -->
              <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: #ffffff; text-align: center;">
                Admin Invitation
              </h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #888888; text-align: center; line-height: 1.6;">
                You've been invited to join Zyrozo as a <strong style="color: #ff6b35;">${roleLabel}</strong>
              </p>
              
              <!-- Invite Code Box -->
              <div style="background: #0a0a0a; border: 2px solid #ff6b35; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                  Your Invite Code
                </p>
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #ffffff; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;">
                  ${invite_code}
                </div>
              </div>
              
              <!-- Instructions -->
              <div style="background: rgba(255, 107, 53, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
                  How to get started:
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #aaaaaa; line-height: 1.8;">
                  <li>Go to Zyrozo and click "Sign Up"</li>
                  <li>Create your account using this email address</li>
                  <li>Your admin role will be automatically assigned!</li>
                </ol>
              </div>
              
              <!-- Expiry Notice -->
              <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
                ⏰ This invite expires on <strong style="color: #888888;">${expiryDate}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #444444;">
                © ${new Date().getFullYear()} Zyrozo. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Zyrozo <onboarding@resend.dev>",
      to: [email],
      subject: `🎉 You're Invited to Join Zyrozo as ${roleLabel}`,
      html: html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Admin invite email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Send admin invite error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
