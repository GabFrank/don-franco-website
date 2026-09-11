/**
 * CRUD helpers genéricos para endpoints de recursos individuales
 * Reduce duplicación de código en archivos [id].ts
 */

import { requireAuth, type Env } from './auth';
import { jsonResponse, now, softDelete, hardDelete } from './db-helpers';

interface CrudOptions {
  tableName: string;
  paramKey?: string;
  selectQuery?: string;
  updateableFields?: string[];
  requiredFields?: string[];
}

/**
 * Handler genérico para GET /:id
 */
export async function handleGetById(
  context: EventContext<Env, string, Record<string, unknown>>,
  options: CrudOptions
): Promise<Response> {
  const { env, params } = context;
  const { tableName, paramKey = 'id', selectQuery } = options;
  
  const id = params[paramKey] as string;
  if (!id) {
    return jsonResponse({ error: `Missing ${paramKey} parameter` }, 400);
  }

  const query = selectQuery || `SELECT * FROM ${tableName} WHERE ${paramKey} = ?`;
  const record = await env.DB
    .prepare(query)
    .bind(id)
    .first();

  if (!record) {
    return jsonResponse({ error: `${tableName} not found` }, 404);
  }

  return jsonResponse(record);
}

/**
 * Handler genérico para PUT /:id
 */
export async function handleUpdateById(
  context: EventContext<Env, string, Record<string, unknown>>,
  options: CrudOptions
): Promise<Response> {
  const { request, env, params } = context;
  const { tableName, paramKey = 'id', updateableFields, requiredFields = [] } = options;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const id = params[paramKey] as string;
  if (!id) {
    return jsonResponse({ error: `Missing ${paramKey} parameter` }, 400);
  }

  try {
    const body = await request.json() as Record<string, any>;

    // Verificar que existe
    const existing = await env.DB
      .prepare(`SELECT * FROM ${tableName} WHERE ${paramKey} = ? AND deleted_at IS NULL`)
      .bind(id)
      .first();

    if (!existing) {
      return jsonResponse({ error: `${tableName} not found` }, 404);
    }

    // Construir UPDATE dinámico
    const updates: string[] = [];
    const bindings: any[] = [];

    const fieldsToUpdate = updateableFields || Object.keys(body);

    for (const field of fieldsToUpdate) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        bindings.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    bindings.push(now());
    bindings.push(id);

    await env.DB
      .prepare(`UPDATE ${tableName} SET ${updates.join(', ')} WHERE ${paramKey} = ?`)
      .bind(...bindings)
      .run();

    const updated = await env.DB
      .prepare(`SELECT * FROM ${tableName} WHERE ${paramKey} = ?`)
      .bind(id)
      .first();

    return jsonResponse(updated);
  } catch (error) {
    console.error(`[${tableName}] PUT error:`, error);
    return jsonResponse({ error: `Failed to update ${tableName}` }, 500);
  }
}

/**
 * Handler genérico para DELETE /:id
 */
export async function handleDeleteById(
  context: EventContext<Env, string, Record<string, unknown>>,
  options: CrudOptions
): Promise<Response> {
  const { request, env, params } = context;
  const { tableName, paramKey = 'id' } = options;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const id = params[paramKey] as string;
  if (!id) {
    return jsonResponse({ error: `Missing ${paramKey} parameter` }, 400);
  }

  try {
    const url = new URL(request.url);
    const hard = url.searchParams.get('hard') === 'true';

    if (hard) {
      const success = await hardDelete(env.DB, tableName, id);
      if (!success) {
        return jsonResponse({ error: `${tableName} not found` }, 404);
      }
      return jsonResponse({ message: `${tableName} permanently deleted` });
    } else {
      const success = await softDelete(env.DB, tableName, id);
      if (!success) {
        return jsonResponse({ error: `${tableName} not found` }, 404);
      }
      return jsonResponse({ message: `${tableName} soft deleted` });
    }
  } catch (error) {
    console.error(`[${tableName}] DELETE error:`, error);
    return jsonResponse({ error: `Failed to delete ${tableName}` }, 500);
  }
}
