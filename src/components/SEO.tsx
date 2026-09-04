import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  type?: "website" | "article" | "product";
  image?: string;
  noindex?: boolean;
  structuredData?: object | object[];
}

const SITE_NAME = "CliporaX";
const DEFAULT_TITLE = "CliporaX — Creator Rewards Platform";
const DEFAULT_DESCRIPTION = "Join 5,000+ creators earning real money on CliporaX. Get paid for every view on TikTok, YouTube & Instagram. $50K+ already paid out. Start earning today!";
const DEFAULT_IMAGE = "https://cliporax.com/og-image.png";
const SITE_URL = "https://cliporax.com";

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  type = "website",
  image = DEFAULT_IMAGE,
  noindex = false,
  structuredData,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  // Convert structuredData to array for multiple schemas
  const schemas = Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@CliporaX" />
      <meta name="twitter:creator" content="@CliporaX" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

// Pre-built structured data schemas
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CliporaX",
  alternateName: "CliporaX Media",
  url: "https://cliporax.com",
  logo: {
    "@type": "ImageObject",
    url: "https://cliporax.com/favicon-512.png",
    width: 512,
    height: 512
  },
  image: "https://cliporax.com/og-image.png",
  description: "CliporaX is the #1 creator rewards platform where content creators earn money for their videos on TikTok, YouTube, and Instagram.",
  foundingDate: "2022",
  sameAs: [
    "https://twitter.com/cliporax",
    "https://instagram.com/cliporax",
    "https://youtube.com/@cliporax",
    "https://tiktok.com/@cliporax"
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@cliporax.com",
    contactType: "customer service",
    availableLanguage: ["English"]
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Creator Lane, Suite 100",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94105",
    addressCountry: "US"
  }
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CliporaX",
  alternateName: "CliporaX Creator Platform",
  url: "https://cliporax.com",
  description: "The #1 creator rewards platform. Earn money for your content.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://cliporax.com/campaigns?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

export const createProductSchema = (product: {
  name: string;
  description: string;
  price: number;
  image?: string;
  seller?: string;
  rating?: number;
  reviewCount?: number;
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.image || DEFAULT_IMAGE,
  url: `${SITE_URL}${product.url}`,
  brand: {
    "@type": "Brand",
    name: product.seller || "CliporaX"
  },
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: product.seller || "CliporaX"
    }
  },
  ...(product.rating && product.reviewCount && {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount
    }
  })
});

export const createCampaignSchema = (campaign: {
  name: string;
  description: string;
  image?: string;
  creator?: string;
  reward: number;
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: campaign.name,
  description: campaign.description || `Earn $${campaign.reward} per 1,000 views on this campaign`,
  image: campaign.image || DEFAULT_IMAGE,
  url: `${SITE_URL}${campaign.url}`,
  provider: {
    "@type": "Organization",
    name: campaign.creator || "CliporaX"
  },
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "USD",
    description: `$${campaign.reward} per 1,000 views`
  }
});

export const createFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(faq => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
});

export const createBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`
  }))
});

export default SEO;
