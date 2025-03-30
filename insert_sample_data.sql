
-- Insert sample products
INSERT INTO products (id, name, description, quantity, category, image_url) VALUES
(1, 'Milk', 'Whole Milk 1L', '1L', 'Dairy', 'https://via.placeholder.com/100x100.png?text=Milk'),
(2, 'Bread', 'White bread loaf', '1 unit', 'Bakery', 'https://via.placeholder.com/100x100.png?text=Bread'),
(3, 'Eggs', '12 Medium Eggs', '12 pcs', 'Dairy', 'https://via.placeholder.com/100x100.png?text=Eggs'),
(4, 'Apple', 'Fresh Red Apple', '1 kg', 'Fruit', 'https://via.placeholder.com/100x100.png?text=Apple'),
(5, 'Chicken Breast', 'Boneless Skinless', '1 kg', 'Meat', 'https://via.placeholder.com/100x100.png?text=Chicken'),
(6, 'Coca-Cola', 'Coca-Cola 1.5L Bottle', '1.5L', 'Drinks', 'https://via.placeholder.com/100x100.png?text=Coke'),
(7, 'Ice Cream', 'Vanilla Ice Cream 500ml', '500 ml', 'Desserts', 'https://via.placeholder.com/100x100.png?text=IceCream');

-- Insert sample current prices
INSERT INTO prices (id, product_id, supermarket, price, updated_at) VALUES
(1, 1, 'Lidl', 1.09, NOW()),
(2, 1, 'Tesco', 1.15, NOW()),
(3, 1, 'Aldi', 1.05, NOW()),
(4, 2, 'Lidl', 1.00, NOW()),
(5, 2, 'Tesco', 1.10, NOW()),
(6, 2, 'Aldi', 0.95, NOW()),
(7, 3, 'Lidl', 2.50, NOW()),
(8, 3, 'Tesco', 2.80, NOW()),
(9, 3, 'Aldi', 2.60, NOW()),
(10, 4, 'Lidl', 1.80, NOW()),
(11, 4, 'Tesco', 1.95, NOW()),
(12, 4, 'Aldi', 1.75, NOW()),
(13, 5, 'Lidl', 6.99, NOW()),
(14, 5, 'Tesco', 7.20, NOW()),
(15, 5, 'Aldi', 6.50, NOW()),
(16, 6, 'Lidl', 1.60, NOW()),
(17, 6, 'Tesco', 1.70, NOW()),
(18, 6, 'Aldi', 1.55, NOW()),
(19, 7, 'Lidl', 3.20, NOW()),
(20, 7, 'Tesco', 3.50, NOW()),
(21, 7, 'Aldi', 3.10, NOW());

-- Insert sample price history
INSERT INTO price_history (product_id, supermarket, price, recorded_at) VALUES
(1, 'Lidl', 1.19, NOW() - INTERVAL '7 days'),
(1, 'Lidl', 1.15, NOW() - INTERVAL '3 days'),
(1, 'Lidl', 1.09, NOW()),
(1, 'Tesco', 1.25, NOW() - INTERVAL '7 days'),
(1, 'Tesco', 1.20, NOW() - INTERVAL '3 days'),
(1, 'Tesco', 1.15, NOW()),
(2, 'Aldi', 1.00, NOW() - INTERVAL '5 days'),
(2, 'Aldi', 0.98, NOW() - INTERVAL '2 days'),
(2, 'Aldi', 0.95, NOW()),
(3, 'Tesco', 2.90, NOW() - INTERVAL '6 days'),
(3, 'Tesco', 2.80, NOW()),
(4, 'Lidl', 1.90, NOW() - INTERVAL '6 days'),
(4, 'Lidl', 1.80, NOW()),
(5, 'Tesco', 7.50, NOW() - INTERVAL '5 days'),
(5, 'Tesco', 7.20, NOW()),
(6, 'Aldi', 1.70, NOW() - INTERVAL '4 days'),
(6, 'Aldi', 1.55, NOW()),
(7, 'Lidl', 3.40, NOW() - INTERVAL '5 days'),
(7, 'Lidl', 3.20, NOW());
