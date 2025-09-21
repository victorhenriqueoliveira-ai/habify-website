-- Add foreign key constraint between orders and profiles
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;