import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

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

// Generate a random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const resendKey = Deno.env.get("RESEND_API_KEY") as string;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: { message: "Server misconfigured" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendKey) {
      console.error("Missing RESEND_API_KEY");
      return new Response(JSON.stringify({ error: { message: "Email service not configured" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(resendKey);

    // Generate our own 6-digit OTP
    const otpCode = generateOtp();
    console.log(`Generated OTP for ${email}: ${otpCode.substring(0, 2)}****`);

    // Check if user exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("listUsers error:", listError.message);
    }

    const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email);
    console.log(`User exists: ${userExists}, isSignup: ${body.isSignup}`);

    // Store OTP in a simple way - we'll use Supabase's signInWithOtp which handles OTP storage internally
    // But we need to use generateLink with type 'magiclink' to get the token, then send our own email
    
    // Use Supabase's built-in OTP mechanism but intercept the email
    // The trick: Use signInWithOtp with shouldCreateUser option, but we need to prevent the default email
    
    // Actually, let's use a different approach:
    // 1. Generate a magic link (which creates the OTP internally)
    // 2. Extract the OTP from the response
    // 3. Send our own email with just the OTP
    
    const verificationType = body.isSignup ? "signup" : "magiclink";
    
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

    // Log the full data structure to understand what we get
    console.log("generateLink response keys:", Object.keys(data));
    console.log("properties:", JSON.stringify(data.properties));
    
    // The OTP should be in data.properties.email_otp
    const supabaseOtp = (data.properties as any)?.email_otp as string | undefined;
    
    // Use Supabase's OTP if available, otherwise we can't verify
    const finalOtp = supabaseOtp;
    
    if (!finalOtp) {
      console.error("No email_otp returned from generateLink. Full response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: { message: "Failed to generate verification code" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`OTP from Supabase: ${finalOtp.length} digits`);

    const subject = body.isSignup
      ? "Zyrozo signup verification code"
      : "Zyrozo login verification code";

    const html = `
<!doctype html>
<html>
  <body style="margin:0;background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
    <div style="max-width:520px;margin:0 auto;padding:32px 18px;">
      <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;">
        <h1 style="margin:0 0 8px 0;font-size:22px;">Your verification code</h1>
        <p style="margin:0 0 18px 0;color:#b0b0b0;font-size:14px;">Use this code to continue.</p>
        <div style="background:#0a0a0a;border:2px solid #ff6b35;border-radius:12px;padding:18px;text-align:center;">
          <div style="font-size:34px;letter-spacing:10px;font-weight:800;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${finalOtp}</div>
        </div>
        <p style="margin:16px 0 0 0;color:#7a7a7a;font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>
    </div>
  </body>
</html>`;

    const { error: sendError } = await resend.emails.send({
      from: "Zyrozo <noreply@zyrozo.com>",
      to: [email],
      subject,
      html,
    });

    if (sendError) {
      console.error("resend error:", sendError.message);
      return new Response(JSON.stringify({ error: { message: "Failed to send email" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Email sent successfully to ${email}`);

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
