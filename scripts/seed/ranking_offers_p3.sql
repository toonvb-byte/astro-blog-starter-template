-- Amazon offers for /es/mejores/colageno/ (label check 4 Nov 2026).
-- Generated from src/content/rankings/es/colageno.md. Applied to nutrimetrics-db on 2026-11-04 (idempotent). Retailer 2 = Amazon.es (ranking_offers.sql).
-- Products 9134-9144, offers 134-144. price = 0 means 'not tracked'.
PRAGMA foreign_keys = ON;

INSERT INTO products (id, brand, name, pack_label, verified, source_url, label_partial) VALUES
  (9134, 'HSN', 'Colágeno Hidrolizado Bovino en Polvo, sin sabor (1 kg)', '1 kg = 100 tomas', 1, 'https://www.amazon.es/dp/B07XFPJP8L', 0),
  (9135, 'Colnatur', 'Complex Neutro (324 g)', '324 g = 30 días', 1, 'https://www.amazon.es/dp/B0GVJHJ9YH', 0),
  (9136, 'Glow25', 'Collagen Powder Original (450 g)', '450 g = 30 tomas', 1, 'https://www.amazon.es/dp/B0FPG73Q25', 0),
  (9137, 'Drasanvi', 'Collmar Colágeno Marino Hidrolizado, sabor vainilla (275 g)', '275 g ≈ 27 tomas', 1, 'https://www.amazon.es/dp/B00NGK3BQ6', 0),
  (9138, 'Vital Proteins', 'Péptidos de Colágeno, sin sabor (587 g)', '587 g ≈ 29 tomas', 1, 'https://www.amazon.es/dp/B0CKMN49WQ', 0),
  (9139, 'Ana María Lajusticia', 'Colágeno con magnesio, pack de 2 × 450 comprimidos', '900 comprimidos = 150 días con 6 al día', 1, 'https://www.amazon.es/dp/B081NV241R', 0),
  (9140, 'WeightWorld', 'Colágeno Marino Hidrolizado 1200 mg (120 cápsulas)', '120 cápsulas = 60 días', 1, 'https://www.amazon.es/dp/B079C336Y3', 0),
  (9141, 'natural elements', 'Colágeno + Ácido hialurónico (180 cápsulas)', '180 cápsulas = 90 días', 1, 'https://www.amazon.es/dp/B07RKWV54M', 0),
  (9142, 'Aldous Bio', 'Colágeno + Ácido Hialurónico + Q10 + Zinc (120 cápsulas)', '120 cápsulas = 120 días', 1, 'https://www.amazon.es/dp/B09HHNZ5Q4', 0),
  (9143, 'N2 Natural Nutrition', 'Multi Colágeno 1650 mg + Vitamina C (180 cápsulas)', '180 cápsulas = 60 días', 1, 'https://www.amazon.es/dp/B0DJGXBKDL', 0),
  (9144, 'NUTRALIE', 'Colágeno Complex con ácido hialurónico (60 cápsulas)', '60 cápsulas = 60 días', 1, 'https://www.amazon.es/dp/B07NNV9ZNP', 0)
ON CONFLICT(id) DO UPDATE SET brand = excluded.brand, name = excluded.name, pack_label = excluded.pack_label, verified = excluded.verified, source_url = excluded.source_url, updated_at = datetime('now');

INSERT INTO offers (id, product_id, retailer_id, country, price, in_stock, stock_note, merchant_url, checked_at) VALUES
  (134, 9134, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B07XFPJP8L', '2026-11-04'),
  (135, 9135, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B0GVJHJ9YH', '2026-11-04'),
  (136, 9136, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B0FPG73Q25', '2026-11-04'),
  (137, 9137, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B00NGK3BQ6', '2026-11-04'),
  (138, 9138, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B0CKMN49WQ', '2026-11-04'),
  (139, 9139, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B081NV241R', '2026-11-04'),
  (140, 9140, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B079C336Y3', '2026-11-04'),
  (141, 9141, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B07RKWV54M', '2026-11-04'),
  (142, 9142, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B09HHNZ5Q4', '2026-11-04'),
  (143, 9143, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B0DJGXBKDL', '2026-11-04'),
  (144, 9144, 2, 'ES', 0, 1, 'price not tracked (Amazon)', 'https://www.amazon.es/dp/B07NNV9ZNP', '2026-11-04')
ON CONFLICT(id) DO UPDATE SET product_id = excluded.product_id, retailer_id = excluded.retailer_id, country = excluded.country, merchant_url = excluded.merchant_url, checked_at = excluded.checked_at;
