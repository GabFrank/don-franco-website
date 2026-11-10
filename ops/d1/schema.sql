-- ============================================================
-- DON FRANCO ADMIN PANEL - Schema D1 MVP
-- Fase 1: Infraestructura base
-- ============================================================

-- ============================================================
-- SETTINGS (config global sin visible)
-- ============================================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================
-- TEXT BLOCKS (cada string renderizable con visible individual)
-- ============================================================
CREATE TABLE text_blocks (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  section TEXT NOT NULL,
  body TEXT NOT NULL,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

CREATE INDEX idx_text_blocks_section ON text_blocks(section);
CREATE INDEX idx_text_blocks_visible ON text_blocks(visible);
CREATE INDEX idx_text_blocks_deleted ON text_blocks(deleted_at);

-- ============================================================
-- IMAGES (binarios en R2 con visible individual)
-- ============================================================
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  section TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  alt TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

CREATE INDEX idx_images_section ON images(section);
CREATE INDEX idx_images_visible ON images(visible);
CREATE INDEX idx_images_deleted ON images(deleted_at);

-- ============================================================
-- BEERS (cerveza con visible en card + FK a image)
-- ============================================================
CREATE TABLE beers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  style TEXT,
  notes TEXT,
  image_id TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
);

CREATE INDEX idx_beers_visible ON beers(visible);
CREATE INDEX idx_beers_deleted ON beers(deleted_at);

-- ============================================================
-- MENU CATEGORIES (visible con cascada a items)
-- ============================================================
CREATE TABLE menu_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

CREATE INDEX idx_menu_categories_visible ON menu_categories(visible);
CREATE INDEX idx_menu_categories_deleted ON menu_categories(deleted_at);

-- ============================================================
-- MENU ITEMS (visible filtrado por category.visible AND item.visible)
-- ============================================================
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER,
  badge TEXT,
  image_id TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_visible ON menu_items(visible);
CREATE INDEX idx_menu_items_deleted ON menu_items(deleted_at);

-- ============================================================
-- MENU PAGES (PNG carta física con visible individual por página)
-- ============================================================
CREATE TABLE menu_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

CREATE INDEX idx_menu_pages_sort ON menu_pages(sort_order);
CREATE INDEX idx_menu_pages_visible ON menu_pages(visible);
CREATE INDEX idx_menu_pages_deleted ON menu_pages(deleted_at);

-- ============================================================
-- GALLERY IMAGES (fotos galería con visible individual)
-- ============================================================
CREATE TABLE gallery_images (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL,
  alt TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

CREATE INDEX idx_gallery_images_sort ON gallery_images(sort_order);
CREATE INDEX idx_gallery_images_visible ON gallery_images(visible);
CREATE INDEX idx_gallery_images_deleted ON gallery_images(deleted_at);

-- ============================================================
-- REVIEW QUOTES (citas con visible individual)
-- ============================================================
CREATE TABLE review_quotes (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

CREATE INDEX idx_review_quotes_visible ON review_quotes(visible);
CREATE INDEX idx_review_quotes_deleted ON review_quotes(deleted_at);

-- ============================================================
-- REVIEW STATS (rating/count + block_visible para toda sección)
-- ============================================================
CREATE TABLE review_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  rating REAL NOT NULL,
  review_count INTEGER NOT NULL,
  block_visible INTEGER DEFAULT 1,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================
-- CONTACT INFO (sin visible — datos core)
-- ============================================================
CREATE TABLE contact_info (
  id INTEGER PRIMARY KEY DEFAULT 1,
  whatsapp TEXT NOT NULL,
  address TEXT NOT NULL,
  hours TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================
-- PUBLISH LOG (auditoría de publicaciones)
-- ============================================================
CREATE TABLE publish_log (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL,
  webhook_response TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER
);

CREATE INDEX idx_publish_log_status ON publish_log(status);
CREATE INDEX idx_publish_log_created ON publish_log(created_at DESC);
