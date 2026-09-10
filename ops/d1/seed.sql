-- ============================================================
-- DON FRANCO SEED DATA
-- Generado automáticamente desde src/content/*.json
-- Fecha: 2026-09-10T21:38:01.357Z
-- ============================================================


-- SETTINGS (configuración global)
INSERT INTO settings (key, value, description) VALUES
  ('menuMode', 'png', 'Modo de visualización del menú: png|digital|both'),
  ('whatsapp', '595983327600', 'Número de WhatsApp de contacto'),
  ('placeId', '', 'Google Place ID para reseñas');

-- TEXT BLOCKS (textos editables del sitio)
INSERT INTO text_blocks (id, key, section, body, visible, sort_order) VALUES
  ('1789076281358-z7c544jzf', 'hero.title', 'hero', 'DON FRANCO', 1, 0),
  ('1789076281358-179nmjq4q', 'hero.tagline', 'hero', 'RESTAURANTE ARTESANAL', 1, 1),
  ('1789076281358-ey1z0bvxb', 'hero.description', 'hero', 'Hamburguesas artesanales, cerveza casera y parrilla en Salto del Guairá.', 1, 2),
  ('1789076281358-xzwvxzg38', 'hero.ctaText', 'hero', 'VER MENÚ', 1, 3),
  ('1789076281358-wvebp1j2l', 'story.title', 'story', 'NUESTRA HISTORIA', 1, 0),
  ('1789076281358-7sxyhzujm', 'story.paragraph.0', 'story', 'Don Franco nace de nuestra pasión por lo artesanal.', 1, 1),
  ('1789076281358-43su74d5w', 'story.paragraph.1', 'story', 'Todo comenzó en 2018, cuando inauguramos en Salto del Guairá la primera fábrica de cerveza artesanal de la región. Lo que empezó como curiosidad se transformó en oficio: aprender, experimentar y crear productos hechos con tiempo, dedicación y personalidad.', 1, 2),
  ('1789076281358-agc8zd3jz', 'story.paragraph.2', 'story', 'En ese camino descubrimos que una buena cerveza siempre encuentra su mejor compañía en una gran comida. Así, en 2020 decidimos dar el siguiente paso y abrir Don Franco Restaurante.', 1, 3),
  ('1789076281358-0dof9ejmw', 'story.paragraph.3', 'story', 'Hoy combinamos esa misma filosofía artesanal en la cocina: hamburguesas autorales, cortes premium, porciones generosas, pizzas y sabores pensados para disfrutarse sin apuro.', 1, 4),
  ('1789076281358-92xgadotl', 'beers.title', 'beers', 'Nuestras cervezas artesanales', 1, 0),
  ('1789076281358-o5sbkorwm', 'reviews.title', 'reviews', 'LO QUE DICEN NUESTROS CLIENTES', 1, 0),
  ('1789076281358-x9lxdvcxs', 'footer.tagline', 'footer', 'Restaurante Artesanal', 1, 0),
  ('1789076281358-4i7veevln', 'footer.legalText', 'footer', 'Todos los derechos reservados.', 1, 1);

-- IMAGES (imágenes para cervezas)
INSERT INTO images (id, key, section, r2_key, alt, visible, sort_order) VALUES
  ('1789076281358-m135ca2r4', 'beer.ipa', 'beer', '/beers/ipa-placeholder.jpg', 'IPA', 1, 0),
  ('1789076281358-oh6jgnvzc', 'beer.lager', 'beer', '/beers/lager-placeholder.jpg', 'Lager', 1, 1),
  ('1789076281358-94bjszppt', 'beer.stout', 'beer', '/beers/stout-placeholder.jpg', 'Stout', 1, 2);

-- BEERS (cervezas artesanales)
INSERT INTO beers (id, name, style, notes, image_id, visible, sort_order) VALUES
  ('1789076281358-592ij00ui', 'IPA', 'India Pale Ale', 'Amarga y aromática con notas cítricas', '1789076281358-m135ca2r4', 1, 0),
  ('1789076281358-iktvmgpq0', 'Lager', 'Cerveza clara', 'Suave y refrescante, perfecta para acompañar', '1789076281358-oh6jgnvzc', 1, 1),
  ('1789076281358-59o7cp4po', 'Stout', 'Cerveza oscura', 'Cremosa con sabores tostados y chocolate', '1789076281358-94bjszppt', 1, 2);

-- MENU CATEGORIES
INSERT INTO menu_categories (id, title, visible, sort_order) VALUES
  ('1789076281358-zh1kd34dp', 'Hamburguesas', 1, 0),
  ('1789076281358-kgrglqq42', 'Pizzas', 1, 1),
  ('1789076281358-00irg44bn', 'Cortes Premium', 1, 2),
  ('1789076281358-tubj7vunj', 'Bebidas', 1, 3),
  ('1789076281358-immlql749', 'Postres', 1, 4);

-- MENU ITEMS
INSERT INTO menu_items (id, category_id, name, description, price, badge, image_id, visible, sort_order) VALUES
  ('1789076281358-hptnre8xz', '1789076281358-zh1kd34dp', 'Don Franco Classic', 'Medallón de carne 180g, queso cheddar, lechuga, tomate, cebolla caramelizada, salsa especial', 45000, NULL, NULL, 1, 0),
  ('1789076281358-ukvd00g3s', '1789076281358-zh1kd34dp', 'Bacon BBQ', 'Medallón de carne 180g, bacon crispy, queso cheddar, cebolla frita, salsa BBQ casera', 52000, NULL, NULL, 1, 1),
  ('1789076281358-hwe2w9ub7', '1789076281358-zh1kd34dp', 'Craft Burger', 'Doble medallón 360g, queso azul, rúcula, tomate seco, cebolla caramelizada, reducción balsámica', 68000, 'Premium', NULL, 1, 2),
  ('1789076281358-z5xhpuzba', '1789076281358-kgrglqq42', 'Margherita', 'Salsa de tomate, mozzarella, albahaca fresca, aceite de oliva', 38000, NULL, NULL, 1, 0),
  ('1789076281358-s6jygoaiu', '1789076281358-kgrglqq42', 'Pepperoni', 'Salsa de tomate, mozzarella, pepperoni italiano', 42000, NULL, NULL, 1, 1),
  ('1789076281358-n7y68ynxs', '1789076281358-kgrglqq42', 'Cuatro Quesos', 'Mozzarella, gorgonzola, provolone, parmesano', 48000, NULL, NULL, 1, 2),
  ('1789076281358-jt1onni55', '1789076281358-00irg44bn', 'Bife de Chorizo', '300g, con guarnición de papas rústicas y ensalada', 85000, 'Premium', NULL, 1, 0),
  ('1789076281358-g2pcs33hm', '1789076281358-00irg44bn', 'Entraña', '350g, marinada con chimichurri, papas y ensalada', 75000, NULL, NULL, 1, 1),
  ('1789076281358-fh2neioa0', '1789076281358-tubj7vunj', 'Cerveza Artesanal IPA', 'Don Franco Brewery - 500ml', 22000, 'Artesanal', NULL, 1, 0),
  ('1789076281358-d53166erk', '1789076281358-tubj7vunj', 'Cerveza Artesanal Lager', 'Don Franco Brewery - 500ml', 20000, 'Artesanal', NULL, 1, 1),
  ('1789076281358-5gecwcqkk', '1789076281358-tubj7vunj', 'Cerveza Artesanal Stout', 'Don Franco Brewery - 500ml', 24000, 'Artesanal', NULL, 1, 2),
  ('1789076281358-fccr7jrb3', '1789076281358-tubj7vunj', 'Agua Mineral', '500ml', 8000, NULL, NULL, 1, 3),
  ('1789076281358-rsu8o13lu', '1789076281358-tubj7vunj', 'Gaseosa', 'Coca-Cola, Sprite, Fanta - 500ml', 10000, NULL, NULL, 1, 4),
  ('1789076281358-a2a5572xt', '1789076281358-immlql749', 'Brownie con Helado', 'Brownie casero con helado de vainilla y salsa de chocolate', 25000, NULL, NULL, 1, 0),
  ('1789076281358-urduyqz11', '1789076281358-immlql749', 'Flan Casero', 'Con dulce de leche', 18000, NULL, NULL, 1, 1);

-- REVIEW QUOTES
INSERT INTO review_quotes (id, author, text, visible, sort_order) VALUES
  ('1789076281358-ji0hkks9e', 'Martín G.', 'Las mejores hamburguesas de la zona, y la cerveza artesanal es espectacular.', 1, 0),
  ('1789076281358-5fucynfbs', 'Carolina R.', 'Ambiente increíble y atención de primera. Volveremos seguro.', 1, 1);

-- REVIEW STATS
INSERT INTO review_stats (rating, review_count, block_visible) VALUES
  (4.8, 120, 1);

-- CONTACT INFO
INSERT INTO contact_info (whatsapp, address, hours) VALUES
  ('595983327600', 'Av. Paraguay c/ 30 de julio, Salto del Guairá, Paraguay', 'Todos los días 17:00 - 00:00');
