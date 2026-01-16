-- Add slug column to campaigns table for SEO-friendly URLs
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);

-- Update existing campaigns with auto-generated slugs from their names
UPDATE public.campaigns 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(TRIM(name), '[^\w\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || LEFT(id::text, 8)
WHERE slug IS NULL;