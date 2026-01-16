import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeaturedNotificationRequest {
  productId: string;
  productTitle: string;
  sellerId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productTitle, sellerId }: FeaturedNotificationRequest = await req.json();

    console.log("Sending featured notification for product:", productId, "to seller:", sellerId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get seller's email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(sellerId);

    if (userError || !userData.user?.email) {
      console.error("Error fetching user email:", userError);
      return new Response(
        JSON.stringify({ error: "Could not find seller email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sellerEmail = userData.user.email;

    // Get seller's profile for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", sellerId)
      .single();

    const sellerName = profile?.display_name || profile?.username || "Seller";

    // Send email notification via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zyrozo <onboarding@resend.dev>",
        to: [sellerEmail],
        subject: "🎉 Your product has been featured!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Your product is now featured</p>
              </div>
              <div style="padding: 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${sellerName},</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Great news! Our team has selected your product <strong>"${productTitle}"</strong> to be featured on the Zyrozo marketplace.
                </p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0; color: #166534; font-weight: 600;">What this means for you:</p>
                  <ul style="color: #166534; margin: 10px 0 0; padding-left: 20px;">
                    <li>Your product appears in the Featured section</li>
                    <li>Increased visibility to all marketplace visitors</li>
                    <li>Higher chance of getting more sales</li>
                  </ul>
                </div>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Keep up the great work and continue providing value to your customers!
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://creator-sparkle-74.lovable.app/marketplace/${productId}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Your Product</a>
                </div>
              </div>
              <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Thank you for being part of Zyrozo!</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    // Create a notification record
    await supabase.from("notifications").insert({
      user_id: sellerId,
      type: "product_featured",
      title: "Your product is featured! 🎉",
      message: `Your product "${productTitle}" has been selected to be featured on the marketplace.`,
      metadata: { product_id: productId }
    });

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-product-featured function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
