/**
 * CRUD endpoints para contact_info (single row)
 * Solo GET y PUT (no POST/DELETE - es singleton)
 */

import { requireAuth, type Env } from '../_shared/auth';
import { now, jsonResponse, corsOptions } from '../_shared/db-helpers';

interface ContactInfo {
  id: number;
  whatsapp: string;
  address: string;
  hours: string;
  updated_at: number;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

// GET /api/contact-info - Obtener (single row)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const contact = await env.DB
    .prepare('SELECT * FROM contact_info WHERE id = 1')
    .first<ContactInfo>();

  if (!contact) {
    return jsonResponse({ error: 'Contact info not found' }, 404);
  }

  return jsonResponse(contact);
};

// PUT /api/contact-info - Actualizar (single row)
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<ContactInfo>;

    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.whatsapp !== undefined) {
      updates.push('whatsapp = ?');
      bindings.push(body.whatsapp);
    }

    if (body.address !== undefined) {
      updates.push('address = ?');
      bindings.push(body.address);
    }

    if (body.hours !== undefined) {
      updates.push('hours = ?');
      bindings.push(body.hours);
    }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    bindings.push(now());

    await env.DB
      .prepare(`UPDATE contact_info SET ${updates.join(', ')} WHERE id = 1`)
      .bind(...bindings)
      .run();

    const updated = await env.DB
      .prepare('SELECT * FROM contact_info WHERE id = 1')
      .first<ContactInfo>();

    return jsonResponse(updated);
  } catch (error) {
    console.error('[contact-info] PUT error:', error);
    return jsonResponse({ error: 'Failed to update contact info' }, 500);
  }
};
