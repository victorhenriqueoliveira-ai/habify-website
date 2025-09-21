-- First, let's check and clean up orphaned orders
-- Delete orders that don't have corresponding profiles
DELETE FROM orders 
WHERE user_id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);

-- Now add the foreign key constraint
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;