-- ============================================================
-- DON FRANCO SEED DATA
-- Generado automáticamente desde src/content/*.json
-- Fecha: 2026-09-10T21:56:48.981Z
-- ============================================================


-- SETTINGS (configuración global)
INSERT INTO settings (key, value, description) VALUES
  ('menuMode', 'png', 'Modo de visualización del menú: png|digital|both'),
  ('whatsapp', '595983327600', 'Número de WhatsApp de contacto'),
  ('placeId', '', 'Google Place ID para reseñas');

-- TEXT BLOCKS (textos editables del sitio)
INSERT INTO text_blocks (id, key, section, body, visible, sort_order) VALUES
  ('1789077408981-2ybhah11p', 'hero.title', 'hero', 'DON FRANCO', 1, 0),
  ('1789077408981-6xm9xejn0', 'hero.tagline', 'hero', 'RESTAURANTE ARTESANAL', 1, 1),
  ('1789077408981-apik00jpp', 'hero.description', 'hero', 'Hamburguesas artesanales, cerveza casera y parrilla en Salto del Guairá.', 1, 2),
  ('1789077408981-028rdkghd', 'hero.ctaText', 'hero', 'VER MENÚ', 1, 3),
  ('1789077408981-7108iwiez', 'story.title', 'story', 'NUESTRA HISTORIA', 1, 0),
  ('1789077408981-33nf8ezy8', 'story.paragraph.0', 'story', 'Don Franco nace de nuestra pasión por lo artesanal.', 1, 1),
  ('1789077408981-zhabtgddp', 'story.paragraph.1', 'story', 'Todo comenzó en 2018, cuando inauguramos en Salto del Guairá la primera fábrica de cerveza artesanal de la región. Lo que empezó como curiosidad se transformó en oficio: aprender, experimentar y crear productos hechos con tiempo, dedicación y personalidad.', 1, 2),
  ('1789077408981-6ymeihelg', 'story.paragraph.2', 'story', 'En ese camino descubrimos que una buena cerveza siempre encuentra su mejor compañía en una gran comida. Así, en 2020 decidimos dar el siguiente paso y abrir Don Franco Restaurante.', 1, 3),
  ('1789077408981-6frdcfy8s', 'story.paragraph.3', 'story', 'Hoy combinamos esa misma filosofía artesanal en la cocina: hamburguesas autorales, cortes premium, porciones generosas, pizzas y sabores pensados para disfrutarse sin apuro.', 1, 4),
  ('1789077408981-w1iawyrgk', 'beers.title', 'beers', 'Nuestras cervezas artesanales', 1, 0),
  ('1789077408981-tdvd57esg', 'reviews.title', 'reviews', 'LO QUE DICEN NUESTROS CLIENTES', 1, 0),
  ('1789077408981-2soh6xa6t', 'footer.tagline', 'footer', 'Restaurante Artesanal', 1, 0),
  ('1789077408981-78blpi2tb', 'footer.legalText', 'footer', 'Todos los derechos reservados.', 1, 1);

-- IMAGES (imágenes para cervezas)
INSERT INTO images (id, key, section, r2_key, alt, visible, sort_order) VALUES
  ('1789077408981-s7021e201', 'beer.ipa', 'beer', '/beers/ipa.svg', 'IPA', 1, 0),
  ('1789077408981-wtvdsfnlf', 'beer.lager', 'beer', '/beers/lager.svg', 'Lager', 1, 1),
  ('1789077408981-emm0mbrmn', 'beer.stout', 'beer', '/beers/stout.svg', 'Stout', 1, 2);

-- BEERS (cervezas artesanales)
INSERT INTO beers (id, name, style, notes, image_id, visible, sort_order) VALUES
  ('1789077408981-fybvp9sqg', 'IPA', 'India Pale Ale', 'Amarga y aromática con notas cítricas', '1789077408981-s7021e201', 1, 0),
  ('1789077408981-rfarxmms3', 'Lager', 'Cerveza clara', 'Suave y refrescante, perfecta para acompañar', '1789077408981-wtvdsfnlf', 1, 1),
  ('1789077408981-d4ma86stc', 'Stout', 'Cerveza oscura', 'Cremosa con sabores tostados y chocolate', '1789077408981-emm0mbrmn', 1, 2);

-- MENU CATEGORIES
INSERT INTO menu_categories (id, title, visible, sort_order) VALUES
  ('1789077408981-jtsn6u6m4', 'Hamburguesas', 1, 0),
  ('1789077408981-j4z762b9u', 'Pizzas', 1, 1),
  ('1789077408981-hgvzcwjxp', 'Cortes Premium', 1, 2),
  ('1789077408981-qwcaplv8g', 'Bebidas', 1, 3),
  ('1789077408981-qgztbhh3h', 'Postres', 1, 4);

-- MENU ITEMS
INSERT INTO menu_items (id, category_id, name, description, price, badge, image_id, visible, sort_order) VALUES
  ('1789077408981-b625k7zx8', '1789077408981-jtsn6u6m4', 'Don Franco Classic', 'Medallón de carne 180g, queso cheddar, lechuga, tomate, cebolla caramelizada, salsa especial', 45000, NULL, NULL, 1, 0),
  ('1789077408981-y1hlj6jrr', '1789077408981-jtsn6u6m4', 'Bacon BBQ', 'Medallón de carne 180g, bacon crispy, queso cheddar, cebolla frita, salsa BBQ casera', 52000, NULL, NULL, 1, 1),
  ('1789077408981-uyjnftf28', '1789077408981-jtsn6u6m4', 'Craft Burger', 'Doble medallón 360g, queso azul, rúcula, tomate seco, cebolla caramelizada, reducción balsámica', 68000, 'Premium', NULL, 1, 2),
  ('1789077408981-yizlvtunx', '1789077408981-j4z762b9u', 'Margherita', 'Salsa de tomate, mozzarella, albahaca fresca, aceite de oliva', 38000, NULL, NULL, 1, 0),
  ('1789077408981-vhkv6ekhn', '1789077408981-j4z762b9u', 'Pepperoni', 'Salsa de tomate, mozzarella, pepperoni italiano', 42000, NULL, NULL, 1, 1),
  ('1789077408981-2d5sj0al5', '1789077408981-j4z762b9u', 'Cuatro Quesos', 'Mozzarella, gorgonzola, provolone, parmesano', 48000, NULL, NULL, 1, 2),
  ('1789077408981-u0z442v7w', '1789077408981-hgvzcwjxp', 'Bife de Chorizo', '300g, con guarnición de papas rústicas y ensalada', 85000, 'Premium', NULL, 1, 0),
  ('1789077408981-9btqe3px1', '1789077408981-hgvzcwjxp', 'Entraña', '350g, marinada con chimichurri, papas y ensalada', 75000, NULL, NULL, 1, 1),
  ('1789077408981-a2338f4om', '1789077408981-qwcaplv8g', 'Cerveza Artesanal IPA', 'Don Franco Brewery - 500ml', 22000, 'Artesanal', NULL, 1, 0),
  ('1789077408981-3s53trifd', '1789077408981-qwcaplv8g', 'Cerveza Artesanal Lager', 'Don Franco Brewery - 500ml', 20000, 'Artesanal', NULL, 1, 1),
  ('1789077408981-upuv62kz7', '1789077408981-qwcaplv8g', 'Cerveza Artesanal Stout', 'Don Franco Brewery - 500ml', 24000, 'Artesanal', NULL, 1, 2),
  ('1789077408981-wa1ltm3s8', '1789077408981-qwcaplv8g', 'Agua Mineral', '500ml', 8000, NULL, NULL, 1, 3),
  ('1789077408981-euqbp6bac', '1789077408981-qwcaplv8g', 'Gaseosa', 'Coca-Cola, Sprite, Fanta - 500ml', 10000, NULL, NULL, 1, 4),
  ('1789077408981-m93gzzfm3', '1789077408981-qgztbhh3h', 'Brownie con Helado', 'Brownie casero con helado de vainilla y salsa de chocolate', 25000, NULL, NULL, 1, 0),
  ('1789077408981-b49r8c9iq', '1789077408981-qgztbhh3h', 'Flan Casero', 'Con dulce de leche', 18000, NULL, NULL, 1, 1);

-- MENU PAGES
INSERT INTO menu_pages (id, title, r2_key, visible, sort_order) VALUES
  ('1789077408981-jcub9grqk', 'Menú página 1', 'https://drive.google.com/file/d/1Aea-cwx1nz5k0qhProcCUTHgtqPxWD7p/view?usp=drive_link', 1, 0),
  ('1789077408981-bslirhdkq', 'Menú página 2', 'https://drive.google.com/file/d/10jHeyfqqlUOZdrLLOChRqXnTJrxSur9I/view?usp=drive_link', 1, 1),
  ('1789077408981-wc0nxfd27', 'Menú página 3', 'https://drive.google.com/file/d/1dDXbp8L3ySSvdJbWN9AqVlbJLAZ9i8Fv/view?usp=drive_link', 1, 2),
  ('1789077408981-4bwomklf6', 'Menú página 4', 'https://drive.google.com/file/d/1v2oINjXbRdq0gA5I77osMx1AfrfwXjuz/view?usp=drive_link', 1, 3),
  ('1789077408981-xawnhtpic', 'Menú página 5', 'https://drive.google.com/file/d/1PsCVfMR2EvUkU-9uM6S8hI5BzPkQpcAo/view?usp=drive_link', 1, 4),
  ('1789077408981-bo836hj93', 'Menú página 6', 'https://drive.google.com/file/d/1zN1M9R4-Vs704wmrUnvz69C42J4byTdA/view?usp=drive_link', 1, 5),
  ('1789077408981-7r3ggwlms', 'Menú página 7', 'https://drive.google.com/file/d/1CGe3p0ySs-5RWfVE5dSdt5ka7aaS7WFW/view?usp=drive_link', 1, 6),
  ('1789077408981-43im4h9jr', 'Menú página 8', 'https://drive.google.com/file/d/1vKQF7MqJ1lI2fv0c8winHWmGSXIbRHMq/view?usp=drive_link', 1, 7),
  ('1789077408981-g92wp64k2', 'Menú página 9', 'https://drive.google.com/file/d/1ZsjHJ98VtZXtnLNikq5kGSGhMXlSq2VJ/view?usp=drive_link', 1, 8),
  ('1789077408981-ubpgq2lfn', 'Menú página 10', 'https://drive.google.com/file/d/1CHHzEkpaMMRWCRuHB1dnBQOj7ttj915t/view?usp=drive_link', 1, 9),
  ('1789077408981-8gt6o3aym', 'Menú página 11', 'https://drive.google.com/file/d/1idjeaYr7E9LO8P6rGt9x5AGcxfMbppZ_/view?usp=drive_link', 1, 10),
  ('1789077408981-vw81747wg', 'Menú página 12', 'https://drive.google.com/file/d/1K0fXUbpHq4Mtxdk8Bq5064ycw0V5Nd4l/view?usp=drive_link', 1, 11);

-- REVIEW QUOTES
INSERT INTO review_quotes (id, author, text, visible, sort_order) VALUES
  ('1789077408981-ecmnikxq0', 'Martín G.', 'Las mejores hamburguesas de la zona, y la cerveza artesanal es espectacular.', 1, 0),
  ('1789077408981-mbccoudd9', 'Carolina R.', 'Ambiente increíble y atención de primera. Volveremos seguro.', 1, 1);

-- REVIEW STATS
INSERT INTO review_stats (rating, review_count, block_visible) VALUES
  (4.8, 120, 1);

-- CONTACT INFO
INSERT INTO contact_info (whatsapp, address, hours) VALUES
  ('595983327600', 'Av. Paraguay c/ 30 de julio, Salto del Guairá, Paraguay', 'Todos los días 17:00 - 00:00');
