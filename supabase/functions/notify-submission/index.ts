import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifySubmissionRequest {
  submission_id: string;
  video_url: string;
  social_link?: string;
  campaign_id: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submission_id, video_url, social_link, campaign_id, user_id }: NotifySubmissionRequest = await req.json();

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch campaign details
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("name")
      .eq("id", campaign_id)
      .single();

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("user_id", user_id)
      .single();

    const creatorName = profile?.username || profile?.display_name || "Unknown Creator";
    const campaignName = campaign?.name || "Unknown Campaign";

    // Get admin email from environment or use default
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";

    // Send email notification to admin
    const emailResponse = await resend.emails.send({
      from: "Zyrozo <notifications@resend.dev>",
      to: [adminEmail],
      subject: `🎬 New Video Submission: ${campaignName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, rgba(234,88,12,0.1), rgba(219,39,119,0.1)); border-radius: 16px; padding: 32px; border: 1px solid rgba(255,255,255,0.1); }
              .header { text-align: center; margin-bottom: 24px; }
              .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #ea580c, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              .title { font-size: 24px; font-weight: 600; margin: 16px 0; }
              .info-box { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 16px 0; }
              .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
              .value { font-size: 16px; font-weight: 500; }
              .link { color: #ea580c; text-decoration: none; word-break: break-all; }
              .button { display: inline-block; background: linear-gradient(135deg, #ea580c, #db2777); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 32px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">⚡ Zyrozo</div>
                <div class="title">New Video Submission!</div>
              </div>
              
              <div class="info-box">
                <div class="label">Creator</div>
                <div class="value">@${creatorName}</div>
              </div>
              
              <div class="info-box">
                <div class="label">Campaign</div>
                <div class="value">${campaignName}</div>
              </div>
              
              <div class="info-box">
                <div class="label">Video URL</div>
                <div class="value"><a href="${video_url}" class="link">${video_url}</a></div>
              </div>
              
              ${social_link ? `
              <div class="info-box">
                <div class="label">Social Media Link</div>
                <div class="value"><a href="${social_link}" class="link">${social_link}</a></div>
              </div>
              ` : ""}
              
              <div class="info-box">
                <div class="label">Submission ID</div>
                <div class="value" style="font-family: monospace; font-size: 14px;">${submission_id}</div>
              </div>
              
              <div style="text-align: center;">
                <a href="${supabaseUrl.replace('.supabase.co', '')}/admin" class="button">
                  Review in Admin Panel
                </a>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from Zyrozo.</p>
                <p>You're receiving this because you're an admin.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-submission function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);