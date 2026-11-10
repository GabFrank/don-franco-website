/**
 * Cloudflare Access JWT validation helpers
 *
 * Validates Cf-Access-Jwt-Assertion header against Cloudflare Access public keys.
 * Supports development bypass mode for local testing.
 */

import { jwtVerify, createRemoteJWKSet } from 'jose';

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  ACCESS_AUD?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ENVIRONMENT?: string;
  ADMIN_DEV_BYPASS_SECRET?: string;
  ADMIN_API_TOKEN?: string;
  CF_PAGES_DEPLOY_HOOK_URL?: string;
}

export interface AuthResult {
  success: boolean;
  email?: string;
  error?: string;
}

/**
 * Comparación de strings en tiempo constante (evita ataques de timing)
 */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  // Recorre siempre la longitud del esperado para no filtrar por tiempo
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < bBytes.length; i++) {
    diff |= (aBytes[i] ?? 0) ^ bBytes[i];
  }
  return diff === 0;
}

/**
 * El bypass de desarrollo solo existe con ENVIRONMENT=development explícito.
 * En production (o sin ENVIRONMENT) queda inactivo aunque exista el secreto.
 */
function devBypassEnabled(env: Env): boolean {
  return env.ENVIRONMENT === 'development' && !!env.ADMIN_DEV_BYPASS_SECRET;
}

/**
 * Validate Cloudflare Access JWT or API Token
 *
 * Soporta tres métodos de autenticación (en orden de prioridad):
 * 1. API Token (X-Admin-Api-Token o Authorization: Bearer) - producción y preview
 * 2. Cloudflare Access JWT - producción y preview
 * 3. Dev bypass secret (ADMIN_DEV_BYPASS_SECRET) - solo en ENVIRONMENT=development
 */
export async function validateAccessJWT(
  request: Request,
  env: Env
): Promise<AuthResult> {
  // 1. API TOKEN: verificar X-Admin-Api-Token o Authorization Bearer
  if (env.ADMIN_API_TOKEN) {
    const authHeader = request.headers.get('Authorization');
    const apiToken = request.headers.get('X-Admin-Api-Token') ||
                     (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (apiToken && timingSafeEqual(apiToken, env.ADMIN_API_TOKEN)) {
      console.log('[AUTH] API token validado');
      return {
        success: true,
        email: 'api-token@system',
      };
    }
  }

  // 2. DEV BYPASS: solo en ENVIRONMENT=development con secret header correcto
  if (devBypassEnabled(env)) {
    const bypassSecret = request.headers.get('ADMIN_DEV_BYPASS_SECRET');
    if (bypassSecret && timingSafeEqual(bypassSecret, env.ADMIN_DEV_BYPASS_SECRET!)) {
      console.log('[AUTH] Dev bypass activado');
      return {
        success: true,
        email: 'dev@localhost',
      };
    }
  }

  // 3. Validación normal de Cloudflare Access JWT
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) {
    return {
      success: false,
      error: 'Missing authentication: provide X-Admin-Api-Token, Authorization Bearer, or Cf-Access-Jwt-Assertion header',
    };
  }

  // Verificar que tenemos configuración de Access
  if (!env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) {
    return {
      success: false,
      error: 'ACCESS_AUD or ACCESS_TEAM_DOMAIN not configured',
    };
  }

  try {
    const certsUrl = `https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;

    // Crear JWKS remoto para verificación
    const JWKS = createRemoteJWKSet(new URL(certsUrl));

    // Verificar JWT
    const { payload } = await jwtVerify(jwt, JWKS, {
      audience: env.ACCESS_AUD,
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
    });

    // Verificar que el payload contiene email
    if (!payload.email || typeof payload.email !== 'string') {
      return {
        success: false,
        error: 'JWT payload missing email',
      };
    }

    return {
      success: true,
      email: payload.email,
    };
  } catch (error) {
    console.error('[AUTH] JWT validation failed:', error);
    return {
      success: false,
      error: 'JWT validation failed',
    };
  }
}

/**
 * Middleware para endpoints que requieren autenticación
 * Retorna Response 401 si autenticación falla
 */
export async function requireAuth(
  request: Request,
  env: Env
): Promise<{ email: string } | Response> {
  const authResult = await validateAccessJWT(request, env);

  if (!authResult.success) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', details: authResult.error }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { email: authResult.email! };
}

/**
 * true si la request viene autenticada como admin (sin responder 401)
 */
export async function isAdminRequest(request: Request, env: Env): Promise<boolean> {
  const authResult = await validateAccessJWT(request, env);
  return authResult.success;
}

/**
 * Extraer email del usuario autenticado (ya validado)
 * Solo para logs/auditoría después de requireAuth
 */
export function getAuthEmail(request: Request): string | null {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) {
    return null;
  }

  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload.email || null;
  } catch {
    return null;
  }
}
