/**
 * Middleware de /api/*: lo que es solo para el admin pide autenticación
 * aunque el endpoint GET sea público.
 * - GET con includeHidden / includeDeleted (contenido oculto o borrado)
 * - GET /api/publish (log de publicaciones: emails y respuestas del deploy hook)
 */

import { requireAuth, type Env } from '../_shared/auth';

const ADMIN_ONLY_GET_PATHS = ['/api/publish'];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const wantsPrivate =
      url.searchParams.get('includeHidden') === 'true' ||
      url.searchParams.get('includeDeleted') === 'true';
    const adminOnlyPath = ADMIN_ONLY_GET_PATHS.some(
      (p) => url.pathname === p || url.pathname.startsWith(p + '/')
    );

    if (wantsPrivate || adminOnlyPath) {
      const authResult = await requireAuth(request, env);
      if (authResult instanceof Response) {
        return authResult;
      }
    }
  }

  return context.next();
};
