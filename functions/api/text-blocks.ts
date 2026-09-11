/**
 * CRUD endpoints para text_blocks
 * GET /api/text-blocks - Listar todos (con filtros)
 * GET /api/text-blocks/:id - Obtener uno
 * POST /api/text-blocks - Crear
 * PUT /api/text-blocks/:id - Actualizar
 * DELETE /api/text-blocks/:id - Soft delete
 */

import { requireAuth, type Env } from '../_shared/auth';
import { 
  generateId, 
  now, 
  softDelete, 
  hardDelete, 
  restore,
  jsonResponse,
  corsOptions,
  buildVisibilityFilter
} from '../_shared/db-helpers';

interface TextBlock {
  id: string;
  key: string;
  section: string;
  body: string;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

// OPTIONS handler
export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

// GET /api/text-blocks - Listar todos
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  const url = new URL(request.url);
  const section = url.searchParams.get('section');
  const includeHidden = url.searchParams.get('includeHidden') === 'true';
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
  
  let query = 'SELECT * FROM text_blocks';
  const conditions: string[] = [];
  const bindings: any[] = [];
  
  if (section) {
    conditions.push('section = ?');
    bindings.push(section);
  }
  
  if (!includeHidden) {
    conditions.push('visible = 1');
  }
  
  if (!includeDeleted) {
    conditions.push('deleted_at IS NULL');
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY section, sort_order, created_at';
  
  const stmt = env.DB.prepare(query);
  const result = await (bindings.length > 0 ? stmt.bind(...bindings) : stmt).all<TextBlock>();
  
  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

// POST /api/text-blocks - Crear
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  // Validar autenticación
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  
  try {
    const body = await request.json() as Partial<TextBlock>;
    
    // Validar campos requeridos
    if (!body.key || !body.section || !body.body) {
      return jsonResponse({ error: 'Missing required fields: key, section, body' }, 400);
    }
    
    // Verificar que key no existe
    const existing = await env.DB
      .prepare('SELECT id FROM text_blocks WHERE key = ?')
      .bind(body.key)
      .first();
    
    if (existing) {
      return jsonResponse({ error: 'Text block with this key already exists' }, 409);
    }
    
    const id = generateId();
    const timestamp = now();
    
    await env.DB
      .prepare(`
        INSERT INTO text_blocks (id, key, section, body, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.key,
        body.section,
        body.body,
        body.visible ?? 1,
        body.sort_order ?? 0,
        timestamp,
        timestamp
      )
      .run();
    
    const created = await env.DB
      .prepare('SELECT * FROM text_blocks WHERE id = ?')
      .bind(id)
      .first<TextBlock>();
    
    return jsonResponse(created, 201);
  } catch (error) {
    console.error('[text-blocks] POST error:', error);
    return jsonResponse({ error: 'Failed to create text block' }, 500);
  }
};

