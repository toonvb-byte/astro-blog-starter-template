-- NutriMetrics.eu — Cloudflare D1 starting schema (SQLite)
-- Prices live here; editorial content (guides, about, comparisons copy) lives in the CMS / repo.

CREATE TABLE categories (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,          -- canonical key, e.g. 'minerals'
  parent_id     INTEGER REFERENCES categories(id)
);

CREATE TABLE category_i18n (
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  locale        TEXT NOT NULL,                 -- 'en','de','fr','es','it','nl','pl','pt'
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,                 -- localised URL slug
  PRIMARY KEY (category_id, locale)
);

CREATE TABLE ingredients (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,          -- 'magnesium'
  norm_unit     TEXT NOT NULL,                 -- unit for comparison, e.g. 'mg', 'g', 'IU'
  norm_amount   REAL NOT NULL                  -- e.g. 100 => "cost per 100 mg"
);

CREATE TABLE products (
  id            INTEGER PRIMARY KEY,
  gtin          TEXT UNIQUE,                   -- EAN/GTIN used to match offers across shops
  brand         TEXT NOT NULL,
  name          TEXT NOT NULL,
  category_id   INTEGER REFERENCES categories(id),
  ingredient_id INTEGER REFERENCES ingredients(id),
  form          TEXT,                          -- 'bisglycinate', 'citrate', 'softgel'...
  amount_per_serving REAL,                     -- elemental/active amount per serving
  amount_unit   TEXT,
  servings      INTEGER,                       -- servings per pack
  pack_label    TEXT,                          -- '120 caps', '500 g'
  third_party_tested INTEGER DEFAULT 0,
  tested_by     TEXT,
  vegan         INTEGER,
  additives     TEXT,
  image_key     TEXT,                          -- R2 object key
  verified      INTEGER DEFAULT 0,             -- manually checked match/spec
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE product_i18n (
  product_id    INTEGER NOT NULL REFERENCES products(id),
  locale        TEXT NOT NULL,
  slug          TEXT NOT NULL,
  display_name  TEXT,
  PRIMARY KEY (product_id, locale)
);

CREATE TABLE retailers (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  network       TEXT,                          -- 'awin', 'direct', 'none'
  awin_mid      TEXT,                          -- AWIN advertiser ID
  ships_from    TEXT,                          -- ISO country
  feed_url      TEXT,                          -- product feed source (store secrets in Worker env, not here)
  active        INTEGER DEFAULT 1
);

CREATE TABLE shipping_rules (
  retailer_id   INTEGER NOT NULL REFERENCES retailers(id),
  country       TEXT NOT NULL,                 -- ship-to ISO country
  cost          REAL NOT NULL,                 -- EUR
  free_over     REAL,                          -- free shipping threshold, EUR
  PRIMARY KEY (retailer_id, country)
);

CREATE TABLE offers (
  id            INTEGER PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES products(id),
  retailer_id   INTEGER NOT NULL REFERENCES retailers(id),
  country       TEXT NOT NULL,                 -- market the price applies to
  price         REAL NOT NULL,                 -- EUR incl. VAT
  in_stock      INTEGER NOT NULL DEFAULT 1,
  stock_note    TEXT,
  merchant_url  TEXT NOT NULL,                 -- raw product URL (wrapped in affiliate link at /go/)
  checked_at    TEXT NOT NULL,
  UNIQUE (product_id, retailer_id, country)
);

CREATE TABLE price_history (                  -- one row per product/country/day: lowest total
  product_id    INTEGER NOT NULL REFERENCES products(id),
  country       TEXT NOT NULL,
  day           TEXT NOT NULL,                 -- 'YYYY-MM-DD'
  min_total     REAL NOT NULL,
  PRIMARY KEY (product_id, country, day)
);

CREATE TABLE price_alerts (
  id            INTEGER PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES products(id),
  country       TEXT NOT NULL,
  email         TEXT NOT NULL,
  target_price  REAL NOT NULL,
  locale        TEXT NOT NULL,
  confirmed     INTEGER DEFAULT 0,             -- double opt-in
  token         TEXT NOT NULL,                 -- confirm/unsubscribe token
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  fired_at      TEXT
);

CREATE TABLE clicks (                          -- outbound affiliate clicks (no personal data)
  id            INTEGER PRIMARY KEY,
  offer_id      INTEGER NOT NULL REFERENCES offers(id),
  page          TEXT,                          -- placement, e.g. 'compare', 'article:magnesium-forms'
  locale        TEXT,
  ts            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_offers_product ON offers(product_id, country);
CREATE INDEX idx_products_ingredient ON products(ingredient_id);
CREATE INDEX idx_alerts_product ON price_alerts(product_id, country, confirmed);
