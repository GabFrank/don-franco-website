/**
 * CRUD endpoints para menu_categories
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

interface MenuCategory {
  id: string;
  title: string;
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
    const category = await env.DB
      .prepare('SELECT * FROM menu_categories WHERE id = ?')
      .bind(params.id as string)
      .first<MenuCategory>();

    if (!category) {
      return jsonResponse({ error: 'Category not found' }, 404);
    }

    return jsonResponse(category);
  }

  const url = new URL(request.url);
  const includeHidden = url.searchParams.get('includeHidden') === 'true';
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

  let query = 'SELECT * FROM menu_categories';
  const conditions: string[] = [];

  if (!includeHidden) {
    conditions.push('visible = 1');
  }

  if (!includeDeleted) {
    conditions.push('deleted_at IS NULL');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY sort_order, created_at';

  const result = await env.DB.prepare(query).all<MenuCategory>();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<MenuCategory>;

    if (!body.title) {
      return jsonResponse({ error: 'Missing required field: title' }, 400);
    }

    const id = generateId();
    const timestamp = now();

    await env.DB
      .prepare(`
        INSERT INTO menu_categories (id, title, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.title,
        body.visible ?? 1,
        body.sort_order ?? 0,
        timestamp,
        timestamp
      )
      .run();

    const created = await env.DB
      .prepare('SELECT * FROM menu_categories WHERE id = ?')
      .bind(id)
      .first<MenuCategory>();

    return jsonResponse(created, 201);
  } catch (error) {
    console.error('[menu-categories] POST error:', error);
    return jsonResponse({ error: 'Failed to create category' }, 500);
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
    const body = await request.json() as Partial<MenuCategory>;

    const existing = await env.DB
      .prepare('SELECT * FROM menu_categories WHERE id = ? AND deleted_at IS NULL')
      .bind(id)
      .first();

    if (!existing) {
      return jsonResponse({ error: 'Category not found' }, 404);
    }

    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      bindings.push(body.title);
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
      .prepare(`UPDATE menu_categories SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();

    const updated = await env.DB
      .prepare('SELECT * FROM menu_categories WHERE id = ?')
      .bind(id)
      .first<MenuCategory>();

    return jsonResponse(updated);
  } catch (error) {
    console.error('[menu-categories] PUT error:', error);
    return jsonResponse({ error: 'Failed to update category' }, 500);
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
      const success = await hardDelete(env.DB, 'menu_categories', id);
      if (!success) {
        return jsonResponse({ error: 'Category not found' }, 404);
      }
      return jsonResponse({ message: 'Category permanently deleted' });
    } else {
      const success = await softDelete(env.DB, 'menu_categories', id);
      if (!success) {
        return jsonResponse({ error: 'Category not found' }, 404);
      }
      return jsonResponse({ message: 'Category soft deleted' });
    }
  } catch (error) {
    console.error('[menu-categories] DELETE error:', error);
    return jsonResponse({ error: 'Failed to delete category' }, 500);
  }
};
