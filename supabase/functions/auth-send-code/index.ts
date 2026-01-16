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
      return new Response(JSON.stringify({ error: { message: "Server misconfigured" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(resendKey);

    const verificationType = body.isSignup ? "signup" : "magiclink";

    // Generate OTP + token hash WITHOUT sending an email from the auth provider.
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

    const otpCode = (data.properties as any)?.email_otp as string | undefined;
    const otpType = (data.properties as any)?.verification_type as string | undefined;

    if (!otpCode) {
      console.error("No email_otp returned from generateLink");
      return new Response(JSON.stringify({ error: { message: "Failed to generate OTP" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        <p style="margin:0 0 18px 0;color:#b0b0b0;font-size:14px;">Use this 6-digit code to continue.</p>
        <div style="background:#0a0a0a;border:2px solid #ff6b35;border-radius:12px;padding:18px;text-align:center;">
          <div style="font-size:34px;letter-spacing:10px;font-weight:800;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${otpCode}</div>
        </div>
        <p style="margin:16px 0 0 0;color:#7a7a7a;font-size:12px;">If you didn’t request this, ignore this email.</p>
      </div>
    </div>
  </body>
</html>`;

    const { error: sendError } = await resend.emails.send({
      from: "Zyrozo <onboarding@resend.dev>",
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

    // For OTP verification on the client, use `type: "email"`.
    return new Response(JSON.stringify({ otpType: "email" }), {
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
