-- NutriMetrics.eu — goal finder (multi-ingredient products, goals, evidence map, market availability)
-- Builds on 0001. Seed data lives in scripts/seed/goal_finder_seed.sql (regenerated from finder data).

-- Ingredients: dose that counts as "effective" per day + safety limit, localised texts
ALTER TABLE ingredients ADD COLUMN effective_amount REAL;      -- daily amount in norm_unit that scores 100%
ALTER TABLE ingredients ADD COLUMN upper_amount REAL;          -- EFSA tolerable upper level, if relevant

CREATE TABLE ingredient_i18n (
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  locale        TEXT NOT NULL,
  name          TEXT NOT NULL,
  tip           TEXT,
  caution       TEXT,
  PRIMARY KEY (ingredient_id, locale)
);

CREATE TABLE goals (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,                  -- 'sleep', 'energy', ...
  icon          TEXT,
  sort          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE goal_i18n (
  goal_id       INTEGER NOT NULL REFERENCES goals(id),
  locale        TEXT NOT NULL,
  name          TEXT NOT NULL,
  warning       TEXT,                                  -- e.g. no authorised 'detox' claim
  PRIMARY KEY (goal_id, locale)
);

CREATE TABLE goal_ingredients (                        -- editorial evidence map
  goal_id         INTEGER NOT NULL REFERENCES goals(id),
  ingredient_id   INTEGER NOT NULL REFERENCES ingredients(id),
  evidence        INTEGER NOT NULL CHECK (evidence BETWEEN 1 AND 3),  -- 1 limited, 2 moderate, 3 strong
  eu_claim        INTEGER NOT NULL DEFAULT 0,          -- EU-authorised health claim exists (Reg. 432/2012)
  deficiency_only INTEGER NOT NULL DEFAULT 0,          -- only helps if deficient (scored at half weight)
  reviewed_by     TEXT,                                -- medical reviewer sign-off
  PRIMARY KEY (goal_id, ingredient_id)
);

CREATE TABLE goal_ingredient_i18n (
  goal_id       INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  locale        TEXT NOT NULL,
  rationale     TEXT NOT NULL,
  PRIMARY KEY (goal_id, ingredient_id, locale),
  FOREIGN KEY (goal_id, ingredient_id) REFERENCES goal_ingredients(goal_id, ingredient_id)
);

-- Products can contain many ingredients (products.ingredient_id stays as the primary one)
CREATE TABLE product_ingredients (
  product_id    INTEGER NOT NULL REFERENCES products(id),
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  amount        REAL,                                  -- per daily dose in ingredients.norm_unit; NULL = not disclosed on label
  form          TEXT,                                  -- 'bisglycinate', 'KSM-66', ...
  PRIMARY KEY (product_id, ingredient_id)
);

ALTER TABLE products ADD COLUMN source_url TEXT;       -- where the label data was taken from
ALTER TABLE products ADD COLUMN label_partial INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN excluded_reason TEXT;  -- e.g. registered medicine → never recommend
ALTER TABLE product_i18n ADD COLUMN dose_label TEXT;   -- '1 capsule a day'

CREATE TABLE product_markets (                         -- where a product can be bought
  product_id    INTEGER NOT NULL REFERENCES products(id),
  country       TEXT NOT NULL,                         -- ISO, 'ES', 'DE'
  status        TEXT NOT NULL CHECK (status IN ('verified','likely')),
  checked_at    TEXT NOT NULL,
  PRIMARY KEY (product_id, country)
);

CREATE TABLE product_notes (                           -- warnings shown on the product card
  id            INTEGER PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES products(id),
  locale        TEXT NOT NULL,
  text          TEXT NOT NULL
);

CREATE INDEX idx_pi_ingredient ON product_ingredients(ingredient_id);
CREATE INDEX idx_pm_country ON product_markets(country);
