import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return json({ error: "Invalid token" }, 401);

    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { inquiry_id, subject, message } = await req.json();
    if (!inquiry_id || !subject || !message) {
      return json({ error: "inquiry_id, subject and message are required" }, 400);
    }

    const { data: inquiry, error: inqError } = await supabase
      .from("business_inquiries")
      .select("id, email, contact_name, company_name")
      .eq("id", inquiry_id)
      .single();
    if (inqError || !inquiry) return json({ error: "Inquiry not found" }, 404);

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("BUSINESS_FROM_EMAIL") || "CliporaX <onboarding@resend.dev>";

    let status = "sent";
    let errorMessage: string | null = null;

    if (!apiKey) {
      status = "failed";
      errorMessage = "Email sending is not configured yet.";
    } else {
      try {
        const resend = new Resend(apiKey);
        const html = `
          <div style="font-family:Inter,Arial,sans-serif;color:#111;line-height:1.6">
            <p>Hi ${inquiry.contact_name || "there"},</p>
            <div style="white-space:pre-wrap">${String(message).replace(/</g, "&lt;")}</div>
            <p style="margin-top:24px;color:#666;font-size:13px">— Team CliporaX</p>
          </div>`;
        const { error } = await resend.emails.send({
          from: fromAddress,
          to: [inquiry.email],
          subject,
          html,
        });
        if (error) {
          status = "failed";
          errorMessage = typeof error === "string" ? error : JSON.stringify(error);
        }
      } catch (e) {
        status = "failed";
        errorMessage = e instanceof Error ? e.message : String(e);
      }
    }

    await supabase.from("business_inquiry_replies").insert({
      inquiry_id,
      admin_id: user.id,
      to_email: inquiry.email,
      subject,
      body: message,
      status,
      error_message: errorMessage,
    });

    if (status === "sent") {
      await supabase
        .from("business_inquiries")
        .update({ status: "contacted" })
        .eq("id", inquiry_id)
        .eq("status", "new");
      return json({ success: true });
    }

    return json({ success: false, error: errorMessage }, 502);
  } catch (e) {
    console.error("send-business-reply error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
