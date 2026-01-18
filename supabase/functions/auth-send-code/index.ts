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

    // Check if user exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("listUsers error:", listError.message);
    }

    const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email);
    console.log(`User exists: ${userExists}, isSignup: ${body.isSignup}`);

    // If user exists but isSignup=true, switch to magiclink (login flow)
    // If user doesn't exist and isSignup=false, return error
    if (!userExists && !body.isSignup) {
      return new Response(JSON.stringify({ error: { message: "No account found with this email. Please sign up first." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use magiclink if user exists (regardless of isSignup), signup only for new users
    const verificationType = userExists ? "magiclink" : "signup";
    console.log(`Using verification type: ${verificationType}`);
    
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: verificationType as any,
      email,
      options: {
        redirectTo: body.redirectTo,
        data: body.metadata ?? {},
      },
    });

    if (error || !data) {
      console.error("generateLink error:", error?.message);
      return new Response(JSON.stringify({ error: { message: error?.message ?? "Failed to generate code" } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("generateLink response keys:", Object.keys(data));
    
    // The OTP should be in data.properties.email_otp
    let finalOtp = (data.properties as any)?.email_otp as string | undefined;
    
    if (!finalOtp) {
      console.error("No email_otp returned from generateLink. Full response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: { message: "Failed to generate verification code" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use only first 6 digits of the OTP
    finalOtp = finalOtp.substring(0, 6);

    console.log(`OTP generated: ${finalOtp.length} digits`);

    const subject = body.isSignup
      ? "Zyrozo - Signup Verification Code"
      : "Zyrozo - Login Verification Code";

    const htmlContent = `
<!doctype html>
<html>
  <body style="margin:0;background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
    <div style="max-width:520px;margin:0 auto;padding:32px 18px;">
      <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;">
        <h1 style="margin:0 0 8px 0;font-size:22px;color:#fff;">Your Verification Code</h1>
        <p style="margin:0 0 18px 0;color:#b0b0b0;font-size:14px;">Use this code to continue with your ${body.isSignup ? 'signup' : 'login'}.</p>
        <div style="background:#0a0a0a;border:2px solid #ff6b35;border-radius:12px;padding:18px;text-align:center;">
          <div style="font-size:38px;letter-spacing:12px;font-weight:800;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#fff;">${finalOtp}</div>
        </div>
        <p style="margin:16px 0 0 0;color:#7a7a7a;font-size:12px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
      <p style="text-align:center;color:#555;font-size:11px;margin-top:20px;">© Zyrozo</p>
    </div>
  </body>
</html>`;

    const textContent = `Your Zyrozo verification code is: ${finalOtp}\n\nThis code expires in 10 minutes. If you didn't request this, please ignore this email.`;

    // Send email using Gmail SMTP
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
        from: `Zyrozo <${gmailUser}>`,
        to: email,
        subject,
        content: textContent,
        html: htmlContent,
      });
      
      await client.close();
      console.log(`Email sent successfully to ${email} via Gmail SMTP`);
    } catch (smtpError: unknown) {
      await client.close();
      const errMsg = smtpError instanceof Error ? smtpError.message : "SMTP error";
      console.error("Gmail SMTP error:", errMsg);
      return new Response(JSON.stringify({ error: { message: "Failed to send email. Check Gmail credentials." } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For OTP verification on the client, use `type: "email"`.
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
