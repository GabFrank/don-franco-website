/**
 * CRUD endpoints para menu_items
 */

import { requireAuth, type Env } from '../_shared/auth';
import {
  generateId,
  now,
  softDelete,
  hardDelete,
  jsonResponse,
  corsOptions,
} from '../_shared/db-helpers';

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  badge: string | null;
  image_id: string | null;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const url = new URL(request.url);
  const categoryId = url.searchParams.get('category_id');
  const includeHidden = url.searchParams.get('includeHidden') === 'true';
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

  let query = `
    SELECT mi.*, mc.title as category_title, mc.visible as category_visible,
           i.r2_key as image_r2_key
    FROM menu_items mi
    JOIN menu_categories mc ON mi.category_id = mc.id
    LEFT JOIN images i ON mi.image_id = i.id
  `;
  const conditions: string[] = [];
  const bindings: any[] = [];

  if (categoryId) {
    conditions.push('mi.category_id = ?');
    bindings.push(categoryId);
  }

  if (!includeHidden) {
    conditions.push('mi.visible = 1');
  }

  if (!includeDeleted) {
    conditions.push('mi.deleted_at IS NULL');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY mi.sort_order, mi.created_at';

  const stmt = env.DB.prepare(query);
  const result = await (bindings.length > 0 ? stmt.bind(...bindings) : stmt).all();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<MenuItem>;

    if (!body.category_id || !body.name) {
      return jsonResponse({ error: 'Missing required fields: category_id, name' }, 400);
    }

    // Verificar que la categoría existe
    const category = await env.DB
      .prepare('SELECT id FROM menu_categories WHERE id = ? AND deleted_at IS NULL')
      .bind(body.category_id)
      .first();

    if (!category) {
      return jsonResponse({ error: 'Category not found' }, 404);
    }

    const id = generateId();
    const timestamp = now();

    await env.DB
      .prepare(`
        INSERT INTO menu_items (id, category_id, name, description, price, badge, image_id, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.category_id,
        body.name,
        body.description || null,
        body.price || null,
        body.badge || null,
        body.image_id || null,
        body.visible ?? 1,
        body.sort_order ?? 0,
        timestamp,
        timestamp
      )
      .run();

    const created = await env.DB
      .prepare('SELECT * FROM menu_items WHERE id = ?')
      .bind(id)
      .first<MenuItem>();

    return jsonResponse(created, 201);
  } catch (error) {
    console.error('[menu-items] POST error:', error);
    return jsonResponse({ error: 'Failed to create menu item' }, 500);
  }
};

