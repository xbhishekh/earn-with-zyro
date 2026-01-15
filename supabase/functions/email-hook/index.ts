import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Email hook payload received:", JSON.stringify(payload, null, 2));

    const { user, email_data } = payload;
    
    if (!user?.email) {
      console.error("No user email found in payload");
      return new Response(JSON.stringify({ error: "No user email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token, email_action_type, redirect_to, token_hash } = email_data || {};
    
    console.log("Email data:", { 
      email: user.email, 
      token: token ? "exists" : "missing",
      email_action_type,
      redirect_to 
    });

    // Get the 6-digit OTP code
    const otpCode = token || "";
    
    // Build the magic link URL (optional fallback)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const magicLink = token_hash 
      ? `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
      : "";

    // Determine email subject based on action type
    let subject = "Your Zyrozo Verification Code";
    if (email_action_type === "signup") {
      subject = "Welcome to Zyrozo - Your Verification Code";
    } else if (email_action_type === "magiclink" || email_action_type === "recovery") {
      subject = "Your Zyrozo Login Code";
    }

    // Beautiful HTML email with OTP code prominently displayed
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse;">
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
              <!-- Title -->
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #ffffff; text-align: center;">
                Your Verification Code
              </h1>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #888888; text-align: center;">
                Enter this code to ${email_action_type === "signup" ? "complete your signup" : "sign in"} to Zyrozo
              </p>
              
              <!-- OTP Code Box -->
              <div style="background: #0a0a0a; border: 2px solid #ff6b35; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;">
                  ${otpCode}
                </div>
              </div>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; text-align: center;">
                This code expires in 10 minutes
              </p>
              
              <!-- Divider -->
              <div style="height: 1px; background: #2a2a2a; margin: 24px 0;"></div>
              
              <!-- Alternative Link (hidden but available) -->
              ${magicLink ? `
              <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
                Or <a href="${magicLink}" style="color: #ff6b35; text-decoration: none;">click here</a> to sign in directly
              </p>
              ` : ""}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">
                If you didn't request this code, you can safely ignore this email.
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

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Zyrozo <onboarding@resend.dev>",
      to: [user.email],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: { message: error.message } }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email hook error:", errorMessage);
    return new Response(
      JSON.stringify({ error: { message: errorMessage } }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
