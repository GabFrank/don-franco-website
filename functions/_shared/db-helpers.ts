/**
 * Database helper utilities para queries D1 comunes
 */

import { nanoid } from 'nanoid';
import type { Env } from './auth';

/**
 * Filtrar resultados por visible y deleted_at
 */
export function buildVisibilityFilter(includeHidden = false, includeDeleted = false): string {
  const conditions: string[] = [];
  
  if (!includeHidden) {
    conditions.push('visible = 1');
  }
  
  if (!includeDeleted) {
    conditions.push('deleted_at IS NULL');
  }
  
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

/**
 * Generar ID único
 */
export function generateId(): string {
  return nanoid();
}

/**
 * Timestamp actual Unix
 */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Validar que un registro existe y no está soft-deleted
 */
export async function recordExists(
  db: D1Database,
  table: string,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare(`SELECT id FROM ${table} WHERE id = ? AND deleted_at IS NULL`)
    .bind(id)
    .first();
  
  return result !== null;
}

/**
 * Soft delete de un registro
 */
export async function softDelete(
  db: D1Database,
  table: string,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare(`UPDATE ${table} SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL`)
    .bind(now(), id)
    .run();
  
  return result.meta.changes > 0;
}

/**
 * Hard delete de un registro (permanente)
 */
export async function hardDelete(
  db: D1Database,
  table: string,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM ${table} WHERE id = ?`)
    .bind(id)
    .run();
  
  return result.meta.changes > 0;
}

/**
 * Restaurar registro soft-deleted
 */
export async function restore(
  db: D1Database,
  table: string,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare(`UPDATE ${table} SET deleted_at = NULL WHERE id = ?`)
    .bind(id)
    .run();
  
  return result.meta.changes > 0;
}

/**
 * Actualizar campo updated_at
 */
export function touchUpdatedAt(): number {
  return now();
}

/**
 * Construir respuesta JSON.
 * Sin Access-Control-Allow-Origin: la web y el admin se sirven desde el mismo
 * origen, así que no hace falta CORS y otros sitios no pueden usar la API desde el navegador.
 */
export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/**
 * Manejar OPTIONS preflight (sin CORS: solo mismo origen)
 */
export function corsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}
