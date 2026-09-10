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
  const { request, env, params } = context;

  if (params.id) {
    const item = await env.DB
      .prepare(`
        SELECT mi.*, mc.title as category_title, mc.visible as category_visible,
               i.r2_key as image_r2_key
        FROM menu_items mi
        JOIN menu_categories mc ON mi.category_id = mc.id
        LEFT JOIN images i ON mi.image_id = i.id
        WHERE mi.id = ?
      `)
      .bind(params.id as string)
      .first();

    if (!item) {
      return jsonResponse({ error: 'Menu item not found' }, 404);
    }

    return jsonResponse(item);
  }

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

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const id = params.id as string;
  if (!id) {
    return jsonResponse({ error: 'Missing id parameter' }, 400);
  }

  try {
    const body = await request.json() as Partial<MenuItem>;

    const existing = await env.DB
      .prepare('SELECT * FROM menu_items WHERE id = ? AND deleted_at IS NULL')
      .bind(id)
      .first();

    if (!existing) {
      return jsonResponse({ error: 'Menu item not found' }, 404);
    }

    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      bindings.push(body.name);
    }

    if (body.description !== undefined) {
      updates.push('description = ?');
      bindings.push(body.description);
    }

    if (body.price !== undefined) {
      updates.push('price = ?');
      bindings.push(body.price);
    }

    if (body.badge !== undefined) {
      updates.push('badge = ?');
      bindings.push(body.badge);
    }

    if (body.image_id !== undefined) {
      updates.push('image_id = ?');
      bindings.push(body.image_id);
    }

    if (body.visible !== undefined) {
      updates.push('visible = ?');
      bindings.push(body.visible);
    }

    if (body.sort_order !== undefined) {
      updates.push('sort_order = ?');
      bindings.push(body.sort_order);
    }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    bindings.push(now());
    bindings.push(id);

    await env.DB
      .prepare(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();

    const updated = await env.DB
      .prepare('SELECT * FROM menu_items WHERE id = ?')
      .bind(id)
      .first<MenuItem>();

    return jsonResponse(updated);
  } catch (error) {
    console.error('[menu-items] PUT error:', error);
    return jsonResponse({ error: 'Failed to update menu item' }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const id = params.id as string;
  if (!id) {
    return jsonResponse({ error: 'Missing id parameter' }, 400);
  }

  try {
    const url = new URL(request.url);
    const hard = url.searchParams.get('hard') === 'true';

    if (hard) {
      const success = await hardDelete(env.DB, 'menu_items', id);
      if (!success) {
        return jsonResponse({ error: 'Menu item not found' }, 404);
      }
      return jsonResponse({ message: 'Menu item permanently deleted' });
    } else {
      const success = await softDelete(env.DB, 'menu_items', id);
      if (!success) {
        return jsonResponse({ error: 'Menu item not found' }, 404);
      }
      return jsonResponse({ message: 'Menu item soft deleted' });
    }
  } catch (error) {
    console.error('[menu-items] DELETE error:', error);
    return jsonResponse({ error: 'Failed to delete menu item' }, 500);
  }
};
