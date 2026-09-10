/**
 * CRUD endpoints para review_quotes
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

interface ReviewQuote {
  id: string;
  author: string;
  text: string;
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
    const quote = await env.DB
      .prepare('SELECT * FROM review_quotes WHERE id = ?')
      .bind(params.id as string)
      .first<ReviewQuote>();

    if (!quote) {
      return jsonResponse({ error: 'Review quote not found' }, 404);
    }

    return jsonResponse(quote);
  }

  const url = new URL(request.url);
  const includeHidden = url.searchParams.get('includeHidden') === 'true';
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

  let query = 'SELECT * FROM review_quotes';
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

  const result = await env.DB.prepare(query).all<ReviewQuote>();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<ReviewQuote>;

    if (!body.author || !body.text) {
      return jsonResponse({ error: 'Missing required fields: author, text' }, 400);
    }

    const id = generateId();
    const timestamp = now();

    await env.DB
      .prepare(`
        INSERT INTO review_quotes (id, author, text, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.author,
        body.text,
        body.visible ?? 1,
        body.sort_order ?? 0,
        timestamp,
        timestamp
      )
      .run();

    const created = await env.DB
      .prepare('SELECT * FROM review_quotes WHERE id = ?')
      .bind(id)
      .first<ReviewQuote>();

    return jsonResponse(created, 201);
  } catch (error) {
    console.error('[review-quotes] POST error:', error);
    return jsonResponse({ error: 'Failed to create review quote' }, 500);
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
    const body = await request.json() as Partial<ReviewQuote>;

    const existing = await env.DB
      .prepare('SELECT * FROM review_quotes WHERE id = ? AND deleted_at IS NULL')
      .bind(id)
      .first();

    if (!existing) {
      return jsonResponse({ error: 'Review quote not found' }, 404);
    }

    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.author !== undefined) {
      updates.push('author = ?');
      bindings.push(body.author);
    }

    if (body.text !== undefined) {
      updates.push('text = ?');
      bindings.push(body.text);
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
      .prepare(`UPDATE review_quotes SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();

    const updated = await env.DB
      .prepare('SELECT * FROM review_quotes WHERE id = ?')
      .bind(id)
      .first<ReviewQuote>();

    return jsonResponse(updated);
  } catch (error) {
    console.error('[review-quotes] PUT error:', error);
    return jsonResponse({ error: 'Failed to update review quote' }, 500);
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
      const success = await hardDelete(env.DB, 'review_quotes', id);
      if (!success) {
        return jsonResponse({ error: 'Review quote not found' }, 404);
      }
      return jsonResponse({ message: 'Review quote permanently deleted' });
    } else {
      const success = await softDelete(env.DB, 'review_quotes', id);
      if (!success) {
        return jsonResponse({ error: 'Review quote not found' }, 404);
      }
      return jsonResponse({ message: 'Review quote soft deleted' });
    }
  } catch (error) {
    console.error('[review-quotes] DELETE error:', error);
    return jsonResponse({ error: 'Failed to delete review quote' }, 500);
  }
};
