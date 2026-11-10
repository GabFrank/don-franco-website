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
  const { request, env } = context;

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

