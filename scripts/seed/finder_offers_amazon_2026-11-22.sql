-- Amazon availability update from the Amazon Price Tracker Google Sheet (22 Nov 2026). Adds Amazon.es offers where the ASIN is now Available and replaces the shop offer in that market.
INSERT OR REPLACE INTO offers (id, product_id, retailer_id, country, price, in_stock, merchant_url, checked_at) VALUES (20112, 5004, 2, 'ES', 0, 1, 'https://www.amazon.es/dp/B00014E9W0', '2026-11-22');
INSERT OR REPLACE INTO offers (id, product_id, retailer_id, country, price, in_stock, merchant_url, checked_at) VALUES (20113, 5016, 2, 'ES', 0, 1, 'https://www.amazon.es/dp/B0C7L3175J', '2026-11-22');
