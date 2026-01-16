import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a unique stylish password
function generatePassword(): string {
  const adjectives = ["Stellar", "Cosmic", "Royal", "Elite", "Prime", "Apex", "Zenith", "Crown"];
  const nouns = ["Phoenix", "Thunder", "Dragon", "Titan", "Falcon", "Eagle", "Lion", "Wolf"];
  const symbols = ["@", "#", "$", "&", "!"];
  const numbers = Math.floor(1000 + Math.random() * 9000);
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  
  return `${adj}${noun}${symbol}${numbers}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get authorization header to verify request is from a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the requester is a super admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requester) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requester is super admin or owner
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.id)
      .maybeSingle();

    if (!roleData || !["super_admin", "owner"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Only super admins can setup owner accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerAccounts = [
      { email: "xbhishekh@gmail.com", title: "Founder", role: "owner" },
      { email: "just4abhii@gmail.com", title: "CEO", role: "owner" },
    ];

    const results = [];

    for (const account of ownerAccounts) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === account.email);

      const password = generatePassword();

      if (existingUser) {
        // Update password for existing user
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password }
        );

        if (updateError) {
          results.push({ email: account.email, status: "error", message: updateError.message });
          continue;
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password,
          email_confirm: true,
          user_metadata: {
            displayName: account.title,
            username: account.title.toLowerCase(),
          },
        });

        if (createError) {
          results.push({ email: account.email, status: "error", message: createError.message });
          continue;
        }

        // Ensure owner role is set
        if (newUser?.user) {
          await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: newUser.user.id, role: account.role }, { onConflict: "user_id" });
        }
      }

      // Send email with credentials
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
            .header { text-align: center; margin-bottom: 30px; }
            .title-badge { display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%); color: #000; padding: 8px 24px; border-radius: 50px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
            h1 { color: #ffd700; margin: 0; font-size: 28px; }
            .subtitle { color: #888; font-size: 14px; margin-top: 8px; }
            .credentials-box { background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3); border-radius: 16px; padding: 30px; margin: 30px 0; }
            .credential-item { margin: 20px 0; }
            .credential-label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .credential-value { background: #0a0a0a; padding: 15px 20px; border-radius: 10px; font-family: 'Courier New', monospace; font-size: 16px; color: #ffd700; word-break: break-all; }
            .warning { background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.3); border-radius: 12px; padding: 20px; margin-top: 30px; }
            .warning-title { color: #ff3b30; font-weight: bold; margin-bottom: 8px; }
            .warning-text { color: #888; font-size: 14px; line-height: 1.6; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
            .crown-icon { font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="crown-icon">👑</div>
              <span class="title-badge">${account.title}</span>
              <h1>Welcome to Zyrozo</h1>
              <p class="subtitle">Your exclusive access credentials</p>
            </div>
            
            <div class="credentials-box">
              <div class="credential-item">
                <div class="credential-label">Email Address</div>
                <div class="credential-value">${account.email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Password</div>
                <div class="credential-value">${password}</div>
              </div>
            </div>
            
            <div class="warning">
              <div class="warning-title">🔐 Security Notice</div>
              <div class="warning-text">
                Please change your password immediately after your first login. 
                Keep these credentials secure and never share them with anyone.
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message from Zyrozo Platform</p>
              <p>© 2026 Zyrozo. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: "Zyrozo <noreply@zyrozo.com>",
          to: account.email,
          subject: `🔐 Your ${account.title} Credentials - Zyrozo Platform`,
          html: emailHtml,
        });
        results.push({ email: account.email, status: "success", title: account.title });
      } catch (emailError) {
        console.error("Email error:", emailError);
        results.push({ email: account.email, status: "created", message: "Account ready but email failed", password });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
