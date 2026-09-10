-- ============================================================
-- DON FRANCO SEED DATA
-- Generado automáticamente desde src/content/*.json
-- Fecha: 2026-09-10T22:13:38.210Z
-- ============================================================


-- SETTINGS (configuración global)
INSERT INTO settings (key, value, description) VALUES
  ('menuMode', 'png', 'Modo de visualización del menú: png|digital|both'),
  ('whatsapp', '595983327600', 'Número de WhatsApp de contacto'),
  ('placeId', '', 'Google Place ID para reseñas');

-- TEXT BLOCKS (textos editables del sitio)
INSERT INTO text_blocks (id, key, section, body, visible, sort_order) VALUES
  ('1789078418210-plwfhkj7x', 'hero.title', 'hero', 'DON FRANCO', 1, 0),
  ('1789078418210-n7ca6y21m', 'hero.tagline', 'hero', 'RESTAURANTE ARTESANAL', 1, 1),
  ('1789078418210-go8e21xtb', 'hero.description', 'hero', 'Hamburguesas artesanales, cerveza casera y parrilla en Salto del Guairá.', 1, 2),
  ('1789078418210-y4exu279i', 'hero.ctaText', 'hero', 'VER MENÚ', 1, 3),
  ('1789078418210-ebxw5502n', 'story.title', 'story', 'NUESTRA HISTORIA', 1, 0),
  ('1789078418210-pw1xn9pho', 'story.paragraph.0', 'story', 'Don Franco nace de nuestra pasión por lo artesanal.', 1, 1),
  ('1789078418210-zsp1cm8tp', 'story.paragraph.1', 'story', 'Todo comenzó en 2018, cuando inauguramos en Salto del Guairá la primera fábrica de cerveza artesanal de la región. Lo que empezó como curiosidad se transformó en oficio: aprender, experimentar y crear productos hechos con tiempo, dedicación y personalidad.', 1, 2),
  ('1789078418210-kx0i9l3p1', 'story.paragraph.2', 'story', 'En ese camino descubrimos que una buena cerveza siempre encuentra su mejor compañía en una gran comida. Así, en 2020 decidimos dar el siguiente paso y abrir Don Franco Restaurante.', 1, 3),
  ('1789078418210-dogl93tsk', 'story.paragraph.3', 'story', 'Hoy combinamos esa misma filosofía artesanal en la cocina: hamburguesas autorales, cortes premium, porciones generosas, pizzas y sabores pensados para disfrutarse sin apuro.', 1, 4),
  ('1789078418210-x27ezcq5o', 'beers.title', 'beers', 'Nuestras cervezas artesanales', 1, 0),
  ('1789078418210-pm11sxb0w', 'reviews.title', 'reviews', 'LO QUE DICEN NUESTROS CLIENTES', 1, 0),
  ('1789078418210-tdaksc9ip', 'footer.tagline', 'footer', 'Restaurante Artesanal', 1, 0),
  ('1789078418210-ca4539tr2', 'footer.legalText', 'footer', 'Todos los derechos reservados.', 1, 1);

-- IMAGES (imágenes para cervezas)
INSERT INTO images (id, key, section, r2_key, alt, visible, sort_order) VALUES
  ('1789078418210-7hxlpiyn2', 'beer.ipa', 'beer', '/beers/ipa.svg', 'IPA', 1, 0),
  ('1789078418210-ydm2ddhdy', 'beer.lager', 'beer', '/beers/lager.svg', 'Lager', 1, 1),
  ('1789078418210-y6lr1qmuc', 'beer.stout', 'beer', '/beers/stout.svg', 'Stout', 1, 2);

-- BEERS (cervezas artesanales)
INSERT INTO beers (id, name, style, notes, image_id, visible, sort_order) VALUES
  ('1789078418210-8u5x455zw', 'IPA', 'India Pale Ale', 'Amarga y aromática con notas cítricas', '1789078418210-7hxlpiyn2', 1, 0),
  ('1789078418210-vt4tb8bv5', 'Lager', 'Cerveza clara', 'Suave y refrescante, perfecta para acompañar', '1789078418210-ydm2ddhdy', 1, 1),
  ('1789078418210-za6vpclqz', 'Stout', 'Cerveza oscura', 'Cremosa con sabores tostados y chocolate', '1789078418210-y6lr1qmuc', 1, 2);

-- MENU CATEGORIES
INSERT INTO menu_categories (id, title, visible, sort_order) VALUES
  ('1789078418210-xa37gzj7m', 'Hamburguesas', 1, 0),
  ('1789078418210-28t3xun94', 'Pizzas', 1, 1),
  ('1789078418210-j8pmfuu9l', 'Cortes Premium', 1, 2),
  ('1789078418210-ftygbdf1n', 'Bebidas', 1, 3),
  ('1789078418210-kolyi1rp8', 'Postres', 1, 4);

-- MENU ITEMS
INSERT INTO menu_items (id, category_id, name, description, price, badge, image_id, visible, sort_order) VALUES
  ('1789078418210-dfvo1po59', '1789078418210-xa37gzj7m', 'Don Franco Classic', 'Medallón de carne 180g, queso cheddar, lechuga, tomate, cebolla caramelizada, salsa especial', 45000, NULL, NULL, 1, 0),
  ('1789078418210-b572qrct7', '1789078418210-xa37gzj7m', 'Bacon BBQ', 'Medallón de carne 180g, bacon crispy, queso cheddar, cebolla frita, salsa BBQ casera', 52000, NULL, NULL, 1, 1),
  ('1789078418210-7etlne9l4', '1789078418210-xa37gzj7m', 'Craft Burger', 'Doble medallón 360g, queso azul, rúcula, tomate seco, cebolla caramelizada, reducción balsámica', 68000, 'Premium', NULL, 1, 2),
  ('1789078418210-rtswig4sz', '1789078418210-28t3xun94', 'Margherita', 'Salsa de tomate, mozzarella, albahaca fresca, aceite de oliva', 38000, NULL, NULL, 1, 0),
  ('1789078418210-885qgozh0', '1789078418210-28t3xun94', 'Pepperoni', 'Salsa de tomate, mozzarella, pepperoni italiano', 42000, NULL, NULL, 1, 1),
  ('1789078418210-9bd1k1apy', '1789078418210-28t3xun94', 'Cuatro Quesos', 'Mozzarella, gorgonzola, provolone, parmesano', 48000, NULL, NULL, 1, 2),
  ('1789078418210-fhn9qtu6d', '1789078418210-j8pmfuu9l', 'Bife de Chorizo', '300g, con guarnición de papas rústicas y ensalada', 85000, 'Premium', NULL, 1, 0),
  ('1789078418210-wdr9dmlkm', '1789078418210-j8pmfuu9l', 'Entraña', '350g, marinada con chimichurri, papas y ensalada', 75000, NULL, NULL, 1, 1),
  ('1789078418210-1un1ppdla', '1789078418210-ftygbdf1n', 'Cerveza Artesanal IPA', 'Don Franco Brewery - 500ml', 22000, 'Artesanal', NULL, 1, 0),
  ('1789078418210-kgujrnz5f', '1789078418210-ftygbdf1n', 'Cerveza Artesanal Lager', 'Don Franco Brewery - 500ml', 20000, 'Artesanal', NULL, 1, 1),
  ('1789078418210-ydoznkfkh', '1789078418210-ftygbdf1n', 'Cerveza Artesanal Stout', 'Don Franco Brewery - 500ml', 24000, 'Artesanal', NULL, 1, 2),
  ('1789078418210-iak00dn5s', '1789078418210-ftygbdf1n', 'Agua Mineral', '500ml', 8000, NULL, NULL, 1, 3),
  ('1789078418210-6czs752ms', '1789078418210-ftygbdf1n', 'Gaseosa', 'Coca-Cola, Sprite, Fanta - 500ml', 10000, NULL, NULL, 1, 4),
  ('1789078418210-cjehf42e0', '1789078418210-kolyi1rp8', 'Brownie con Helado', 'Brownie casero con helado de vainilla y salsa de chocolate', 25000, NULL, NULL, 1, 0),
  ('1789078418210-y0vqcjref', '1789078418210-kolyi1rp8', 'Flan Casero', 'Con dulce de leche', 18000, NULL, NULL, 1, 1);

-- MENU PAGES
INSERT INTO menu_pages (id, title, r2_key, visible, sort_order) VALUES
  ('1789078418210-b1c0dgqss', 'Menú página 1', 'https://lh3.googleusercontent.com/d/1Aea-cwx1nz5k0qhProcCUTHgtqPxWD7p=w2000', 1, 0),
  ('1789078418210-s9hpl8xgb', 'Menú página 2', 'https://lh3.googleusercontent.com/d/10jHeyfqqlUOZdrLLOChRqXnTJrxSur9I=w2000', 1, 1),
  ('1789078418210-7mgzca4zq', 'Menú página 3', 'https://lh3.googleusercontent.com/d/1dDXbp8L3ySSvdJbWN9AqVlbJLAZ9i8Fv=w2000', 1, 2),
  ('1789078418210-an6q992cf', 'Menú página 4', 'https://lh3.googleusercontent.com/d/1v2oINjXbRdq0gA5I77osMx1AfrfwXjuz=w2000', 1, 3),
  ('1789078418210-aykoecdph', 'Menú página 5', 'https://lh3.googleusercontent.com/d/1PsCVfMR2EvUkU-9uM6S8hI5BzPkQpcAo=w2000', 1, 4),
  ('1789078418210-eontg1ph1', 'Menú página 6', 'https://lh3.googleusercontent.com/d/1zN1M9R4-Vs704wmrUnvz69C42J4byTdA=w2000', 1, 5),
  ('1789078418210-vdzxy2se8', 'Menú página 7', 'https://lh3.googleusercontent.com/d/1CGe3p0ySs-5RWfVE5dSdt5ka7aaS7WFW=w2000', 1, 6),
  ('1789078418210-dbn8hscl9', 'Menú página 8', 'https://lh3.googleusercontent.com/d/1vKQF7MqJ1lI2fv0c8winHWmGSXIbRHMq=w2000', 1, 7),
  ('1789078418210-jh481vyt5', 'Menú página 9', 'https://lh3.googleusercontent.com/d/1ZsjHJ98VtZXtnLNikq5kGSGhMXlSq2VJ=w2000', 1, 8),
  ('1789078418210-jqiig4oaw', 'Menú página 10', 'https://lh3.googleusercontent.com/d/1CHHzEkpaMMRWCRuHB1dnBQOj7ttj915t=w2000', 1, 9),
  ('1789078418210-iwh5rsx6m', 'Menú página 11', 'https://lh3.googleusercontent.com/d/1idjeaYr7E9LO8P6rGt9x5AGcxfMbppZ_=w2000', 1, 10),
  ('1789078418210-venxowf1l', 'Menú página 12', 'https://lh3.googleusercontent.com/d/1K0fXUbpHq4Mtxdk8Bq5064ycw0V5Nd4l=w2000', 1, 11);

-- REVIEW QUOTES
INSERT INTO review_quotes (id, author, text, visible, sort_order) VALUES
  ('1789078418210-hb3k87mix', 'Martín G.', 'Las mejores hamburguesas de la zona, y la cerveza artesanal es espectacular.', 1, 0),
  ('1789078418210-6dflvk3fx', 'Carolina R.', 'Ambiente increíble y atención de primera. Volveremos seguro.', 1, 1);

-- REVIEW STATS
INSERT INTO review_stats (rating, review_count, block_visible) VALUES
  (4.8, 120, 1);

-- CONTACT INFO
INSERT INTO contact_info (whatsapp, address, hours) VALUES
  ('595983327600', 'Av. Paraguay c/ 30 de julio, Salto del Guairá, Paraguay', 'Todos los días 17:00 - 00:00');
