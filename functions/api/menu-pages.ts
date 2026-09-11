/**
 * CRUD endpoints para menu_pages (carta física PNG)
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

interface MenuPage {
  id: string;
  title: string;
  r2_key: string;
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

  let query = 'SELECT * FROM menu_pages';
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

  const result = await env.DB.prepare(query).all<MenuPage>();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<MenuPage>;

    if (!body.title || !body.r2_key) {
      return jsonResponse({ error: 'Missing required fields: title, r2_key' }, 400);
    }

    const id = generateId();
    const timestamp = now();

    await env.DB
      .prepare(`
        INSERT INTO menu_pages (id, title, r2_key, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.title,
        body.r2_key,
        body.visible ?? 1,
        body.sort_order ?? 0,
        timestamp,
        timestamp
      )
      .run();

    const created = await env.DB
      .prepare('SELECT * FROM menu_pages WHERE id = ?')
      .bind(id)
      .first<MenuPage>();

    return jsonResponse(created, 201);
  } catch (error) {
    console.error('[menu-pages] POST error:', error);
    return jsonResponse({ error: 'Failed to create menu page' }, 500);
  }
};

