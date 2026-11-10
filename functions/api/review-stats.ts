/**
 * Endpoints para review_stats (single row)
 * GET y PUT únicamente
 */

import { requireAuth, type Env } from '../_shared/auth';
import { now, jsonResponse, corsOptions } from '../_shared/db-helpers';

interface ReviewStats {
  id: number;
  rating: number;
  review_count: number;
  block_visible: number;
  updated_at: number;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const stats = await env.DB
    .prepare('SELECT * FROM review_stats WHERE id = 1')
    .first<ReviewStats>();

  if (!stats) {
    return jsonResponse({ error: 'Review stats not found' }, 404);
  }

  return jsonResponse(stats);
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<ReviewStats>;

    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.rating !== undefined) {
      updates.push('rating = ?');
      bindings.push(body.rating);
    }

    if (body.review_count !== undefined) {
      updates.push('review_count = ?');
      bindings.push(body.review_count);
    }

    if (body.block_visible !== undefined) {
      updates.push('block_visible = ?');
      bindings.push(body.block_visible);
    }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    bindings.push(now());

    await env.DB
      .prepare(`UPDATE review_stats SET ${updates.join(', ')} WHERE id = 1`)
      .bind(...bindings)
      .run();

    const updated = await env.DB
      .prepare('SELECT * FROM review_stats WHERE id = 1')
      .first<ReviewStats>();

    return jsonResponse(updated);
  } catch (error) {
    console.error('[review-stats] PUT error:', error);
    return jsonResponse({ error: 'Failed to update review stats' }, 500);
  }
};
