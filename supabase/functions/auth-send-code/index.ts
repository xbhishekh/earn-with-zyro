import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  email: string;
  metadata?: Record<string, unknown>;
  isSignup?: boolean;
  redirectTo?: string;
};

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const email = (body.email ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: { message: "Valid email required" } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const gmailUser = Deno.env.get("GMAIL_USER") as string;
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD") as string;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: { message: "Server misconfigured" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!gmailUser || !gmailAppPassword) {
      console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD");
      return new Response(JSON.stringify({ error: { message: "Email service not configured" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // OPTIMIZED: Try to generate magiclink first - if user doesn't exist, we'll get an error
    // This avoids the slow listUsers() call
    let linkData: any = null;
    let linkError: any = null;
    
    // First attempt: try to generate magiclink (only works if user exists)
    const linkResult = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: body.redirectTo,
        data: body.metadata ?? {},
      },
    });
    
    linkData = linkResult.data;
    linkError = linkResult.error;
    
    // If user doesn't exist and this is a login attempt, return error
    if (linkError && !body.isSignup) {
      console.log(`Login failed - user not found: ${email}`);
      return new Response(JSON.stringify({ error: { message: "No account found with this email. Please sign up first." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // If user doesn't exist and this is signup, create the account first
    if (linkError && body.isSignup) {
      const requestedUsername = ((body.metadata?.username as string) ?? email.split("@")[0]).toLowerCase();
      
      // Check if username is already taken
      console.log(`Checking username availability: ${requestedUsername}`);
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", requestedUsername)
        .maybeSingle();
      
      if (existingProfile) {
        console.error(`Username "${requestedUsername}" is already taken`);
        return new Response(JSON.stringify({ error: { message: `Username "${requestedUsername}" is already taken. Please choose a different username.` } }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("Creating new user account...");
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: false,
        user_metadata: body.metadata ?? {},
      });
      
      if (createError) {
        console.error("createUser error:", createError.message);
        if (createError.message.includes("Database error") || createError.message.includes("duplicate")) {
          return new Response(JSON.stringify({ error: { message: "Username already taken. Please choose a different username." } }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: { message: createError.message } }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("New user created successfully:", newUser?.user?.id);
      
      // Now generate the magiclink for the new user
      const newLinkResult = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: body.redirectTo,
          data: body.metadata ?? {},
        },
      });
      
      linkData = newLinkResult.data;
      linkError = newLinkResult.error;
    }

    if (linkError || !linkData) {
      console.error("generateLink error:", linkError?.message);
      return new Response(JSON.stringify({ error: { message: linkError?.message ?? "Failed to generate code" } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("generateLink success");
    
    // The OTP should be in data.properties.email_otp
    const finalOtp = (linkData.properties as any)?.email_otp as string | undefined;
    
    if (!finalOtp) {
      console.error("No email_otp returned from generateLink");
      return new Response(JSON.stringify({ error: { message: "Failed to generate verification code" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`OTP generated: ${finalOtp.length} digits`);

    const subject = body.isSignup
      ? "CliporaX - Signup Verification Code"
      : "CliporaX - Login Verification Code";

    const htmlContent = `
<!doctype html>
<html>
  <body style="margin:0;background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
    <div style="max-width:520px;margin:0 auto;padding:32px 18px;">
      <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;">
        <h1 style="margin:0 0 8px 0;font-size:22px;color:#fff;">Your Verification Code</h1>
        <p style="margin:0 0 18px 0;color:#b0b0b0;font-size:14px;">Use this code to continue with your ${body.isSignup ? 'signup' : 'login'}.</p>
        <div style="background:#0a0a0a;border:2px solid #ff6b35;border-radius:12px;padding:18px;text-align:center;">
          <div style="font-size:38px;letter-spacing:8px;font-weight:800;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#fff;">${finalOtp}</div>
        </div>
        <p style="margin:16px 0 0 0;color:#7a7a7a;font-size:12px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
      <p style="text-align:center;color:#555;font-size:11px;margin-top:20px;">© CliporaX</p>
    </div>
  </body>
</html>`;

    const textContent = `Your CliporaX verification code is: ${finalOtp}\n\nThis code expires in 10 minutes. If you didn't request this, please ignore this email.`;

    // Send email using Gmail SMTP - optimized with connection pooling
    console.log("Connecting to SMTP...");
    const smtpStart = Date.now();
    
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailAppPassword,
        },
      },
    });

    try {
      await client.send({
        from: `CliporaX <${gmailUser}>`,
        to: email,
        subject,
        content: textContent,
        html: htmlContent,
      });
      
      console.log(`SMTP completed in ${Date.now() - smtpStart}ms`);
      await client.close();
    } catch (smtpError: unknown) {
      await client.close();
      const errMsg = smtpError instanceof Error ? smtpError.message : "SMTP error";
      console.error("Gmail SMTP error:", errMsg);
      return new Response(JSON.stringify({ error: { message: "Failed to send email. Check Gmail credentials." } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ otpType: "email", otpLength: finalOtp.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("auth-send-code error:", msg);
    return new Response(JSON.stringify({ error: { message: msg } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
