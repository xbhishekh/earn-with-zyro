import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://earn-with-zyro.lovable.app";

// Static pages with their priorities and change frequencies
const staticPages = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/campaigns", priority: "0.9", changefreq: "daily" },
  { url: "/marketplace", priority: "0.9", changefreq: "daily" },
  { url: "/gallery", priority: "0.8", changefreq: "daily" },
  { url: "/about", priority: "0.7", changefreq: "monthly" },
  { url: "/pricing", priority: "0.8", changefreq: "weekly" },
  { url: "/careers", priority: "0.6", changefreq: "weekly" },
  { url: "/contact", priority: "0.6", changefreq: "monthly" },
  { url: "/affiliate", priority: "0.7", changefreq: "monthly" },
  { url: "/terms", priority: "0.3", changefreq: "yearly" },
  { url: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function formatDate(date: string | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active campaigns with slugs
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id, slug, updated_at, name")
      .eq("status", "active")
      .order("updated_at", { ascending: false });

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError);
    }

    // Fetch active marketplace products with slugs
    const { data: products, error: productsError } = await supabase
      .from("marketplace_products")
      .select("id, slug, updated_at, title")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    // Build sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${formatDate(null)}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add campaign pages
    if (campaigns && campaigns.length > 0) {
      for (const campaign of campaigns) {
        const url = campaign.slug 
          ? `${SITE_URL}/c/${escapeXml(campaign.slug)}`
          : `${SITE_URL}/campaign/${campaign.id}`;
        
        xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${formatDate(campaign.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add marketplace product pages
    if (products && products.length > 0) {
      for (const product of products) {
        const url = product.slug 
          ? `${SITE_URL}/marketplace/${escapeXml(product.slug)}`
          : `${SITE_URL}/marketplace/${product.id}`;
        
        xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${formatDate(product.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    // Return sitemap with proper XML content type
    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate sitemap" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
