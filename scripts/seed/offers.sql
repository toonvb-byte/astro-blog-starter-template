-- Direct affiliate offers used by /go/{offerId}. Applied to nutrimetrics-db by hand (idempotent).
-- Product IDs 9001+ are reserved for products outside the goal finder (finder products use 5001+ in list order).
PRAGMA foreign_keys = ON;

-- Nutrición Científica Barcelona: direct partner, sales attributed through the discount code ENERGIA10.
INSERT INTO retailers (id, name, network, awin_mid, ships_from, feed_url, active)
VALUES (1, 'Nutrición Científica Barcelona', 'direct', NULL, 'ES', NULL, 1)
ON CONFLICT(id) DO UPDATE SET name = excluded.name, network = excluded.network, ships_from = excluded.ships_from, active = excluded.active;

INSERT INTO products (id, brand, name, pack_label, vegan, verified, source_url, label_partial)
VALUES (9001, 'NCB', 'EnergyProDetox', '22 sobres de 10 g', NULL, 0, 'https://nutricioncientificabarcelona.com/products/energy-pro-detox', 0)
ON CONFLICT(id) DO UPDATE SET brand = excluded.brand, name = excluded.name, pack_label = excluded.pack_label, source_url = excluded.source_url, updated_at = datetime('now');

-- Landing page: /es/productos/energyprodetox/. The discount link sets the code and sends the visitor to the product page.
INSERT INTO offers (id, product_id, retailer_id, country, price, in_stock, stock_note, merchant_url, checked_at)
VALUES (1, 9001, 1, 'ES', 79.90, 1, NULL, 'https://nutricioncientificabarcelona.com/discount/ENERGIA10?redirect=%2Fproducts%2Fenergy-pro-detox', '2026-10-21')
ON CONFLICT(id) DO UPDATE SET price = excluded.price, in_stock = excluded.in_stock, merchant_url = excluded.merchant_url, checked_at = excluded.checked_at;
