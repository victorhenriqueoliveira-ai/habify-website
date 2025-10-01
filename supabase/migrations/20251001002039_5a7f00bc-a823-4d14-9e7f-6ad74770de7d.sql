-- Add kiwify_product_id to plans table to map Kiwify products
ALTER TABLE plans ADD COLUMN IF NOT EXISTS kiwify_product_id TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN plans.kiwify_product_id IS 'ID do produto na Kiwify para gerar link de checkout';