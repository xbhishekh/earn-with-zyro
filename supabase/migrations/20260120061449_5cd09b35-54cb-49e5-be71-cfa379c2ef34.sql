-- Create product content modules table (for organizing content like courses, lessons, etc.)
CREATE TABLE public.product_content_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product content items table (individual pieces of content)
CREATE TABLE public.product_content_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.product_content_modules(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'video', 'file', 'link', 'youtube', 'livestream', 'embed'
  content_data JSONB, -- {url, embed_code, text_content, file_size, duration, etc.}
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_free_preview BOOLEAN DEFAULT false, -- Allow non-purchasers to preview
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create content access tracking (for analytics)
CREATE TABLE public.content_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id UUID NOT NULL REFERENCES public.product_content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_content_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS for product_content_modules
CREATE POLICY "Sellers can manage their product modules"
ON public.product_content_modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_products mp 
    WHERE mp.id = product_id AND mp.seller_id = auth.uid()
  )
);

CREATE POLICY "Purchasers can view published modules"
ON public.product_content_modules
FOR SELECT
USING (
  is_published = true AND
  EXISTS (
    SELECT 1 FROM public.product_purchases pp 
    WHERE pp.product_id = product_content_modules.product_id 
    AND pp.buyer_id = auth.uid()
    AND pp.status = 'completed'
  )
);

-- RLS for product_content_items
CREATE POLICY "Sellers can manage their content items"
ON public.product_content_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_products mp 
    WHERE mp.id = product_id AND mp.seller_id = auth.uid()
  )
);

CREATE POLICY "Purchasers can view published content"
ON public.product_content_items
FOR SELECT
USING (
  (is_published = true AND
  EXISTS (
    SELECT 1 FROM public.product_purchases pp 
    WHERE pp.product_id = product_content_items.product_id 
    AND pp.buyer_id = auth.uid()
    AND pp.status = 'completed'
  ))
  OR
  (is_free_preview = true AND is_published = true)
);

-- RLS for content_access_logs
CREATE POLICY "Users can log their own access"
ON public.content_access_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sellers can view their content access logs"
ON public.content_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.product_content_items pci
    JOIN public.marketplace_products mp ON mp.id = pci.product_id
    WHERE pci.id = content_item_id AND mp.seller_id = auth.uid()
  )
);

-- Enable realtime for content items
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_content_items;

-- Create indexes for performance
CREATE INDEX idx_content_modules_product ON public.product_content_modules(product_id);
CREATE INDEX idx_content_items_product ON public.product_content_items(product_id);
CREATE INDEX idx_content_items_module ON public.product_content_items(module_id);
CREATE INDEX idx_content_access_user ON public.content_access_logs(user_id);
CREATE INDEX idx_content_access_item ON public.content_access_logs(content_item_id);