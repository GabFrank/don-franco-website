/**
 * CRUD endpoints para gallery_images
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

interface GalleryImage {
  id: string;
  r2_key: string;
  alt: string | null;
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
    const image = await env.DB
      .prepare('SELECT * FROM gallery_images WHERE id = ?')
      .bind(params.id as string)
      .first<GalleryImage>();

    if (!image) {
      return jsonResponse({ error: 'Gallery image not found' }, 404);
    }

    return jsonResponse(image);
  }

  const url = new URL(request.url);
  const includeHidden = url.searchParams.get('includeHidden') === 'true';
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

  let query = 'SELECT * FROM gallery_images';
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

  const result = await env.DB.prepare(query).all<GalleryImage>();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<GalleryImage>;

    if (!body.r2_key) {
      return jsonResponse({ error: 'Missing required field: r2_key' }, 400);
    }

    const id = generateId();
    const timestamp = now();

    await env.DB
      .prepare(`
        INSERT INTO gallery_images (id, r2_key, alt, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.r2_key,
        body.alt || null,
        body.visible ?? 1,
        body.sort_order ?? 0,
        timestamp,
        timestamp
      )
      .run();

    const created = await env.DB
      .prepare('SELECT * FROM gallery_images WHERE id = ?')
      .bind(id)
      .first<GalleryImage>();

    return jsonResponse(created, 201);
  } catch (error) {
    console.error('[gallery-images] POST error:', error);
    return jsonResponse({ error: 'Failed to create gallery image' }, 500);
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
    const body = await request.json() as Partial<GalleryImage>;

    const existing = await env.DB
      .prepare('SELECT * FROM gallery_images WHERE id = ? AND deleted_at IS NULL')
      .bind(id)
      .first();

    if (!existing) {
      return jsonResponse({ error: 'Gallery image not found' }, 404);
    }

    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.alt !== undefined) {
      updates.push('alt = ?');
      bindings.push(body.alt);
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
      .prepare(`UPDATE gallery_images SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();

    const updated = await env.DB
      .prepare('SELECT * FROM gallery_images WHERE id = ?')
      .bind(id)
      .first<GalleryImage>();

    return jsonResponse(updated);
  } catch (error) {
    console.error('[gallery-images] PUT error:', error);
    return jsonResponse({ error: 'Failed to update gallery image' }, 500);
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
      const success = await hardDelete(env.DB, 'gallery_images', id);
      if (!success) {
        return jsonResponse({ error: 'Gallery image not found' }, 404);
      }
      return jsonResponse({ message: 'Gallery image permanently deleted' });
    } else {
      const success = await softDelete(env.DB, 'gallery_images', id);
      if (!success) {
        return jsonResponse({ error: 'Gallery image not found' }, 404);
      }
      return jsonResponse({ message: 'Gallery image soft deleted' });
    }
  } catch (error) {
    console.error('[gallery-images] DELETE error:', error);
    return jsonResponse({ error: 'Failed to delete gallery image' }, 500);
  }
};
