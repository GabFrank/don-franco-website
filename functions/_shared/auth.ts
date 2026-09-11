/**
 * Cloudflare Access JWT validation helpers
 * 
 * Validates Cf-Access-Jwt-Assertion header against Cloudflare Access public keys.
 * Supports development bypass mode for local testing.
 */

import { jwtVerify, importSPKI, createRemoteJWKSet } from 'jose';

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
    const apiToken = request.headers.get('X-Admin-Api-Token') || 
                     request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (apiToken && apiToken === env.ADMIN_API_TOKEN) {
      console.log('[AUTH] API token validado');
      return {
        success: true,
        email: 'api-token@system',
      };
    }
  }

  // 2. DEV BYPASS: solo en ENVIRONMENT=development con secret header correcto
  if (env.ENVIRONMENT === 'development' && env.ADMIN_DEV_BYPASS_SECRET) {
    const bypassSecret = request.headers.get('ADMIN_DEV_BYPASS_SECRET');
    if (bypassSecret === env.ADMIN_DEV_BYPASS_SECRET) {
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
    // Obtener certificados públicos de Cloudflare Access
    const certsUrl = `https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;
    const certsResponse = await fetch(certsUrl);
    
    if (!certsResponse.ok) {
      throw new Error(`Failed to fetch Access certs: ${certsResponse.statusText}`);
    }

    const certs = await certsResponse.json() as { keys: Array<{ kid: string; kty: string; alg: string; use: string; e: string; n: string }> };
    
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
      error: error instanceof Error ? error.message : 'JWT validation failed',
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
 * Extraer email del usuario autenticado (ya validado)
 */
export function getAuthEmail(request: Request): string | null {
  // En dev bypass mode, retornar email por defecto
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) {
    return 'dev@localhost'; // Asumiendo dev bypass
  }

  // En producción, el email está en el JWT (pero ya debería estar validado)
  // Esta función es solo para logs/auditoría después de requireAuth
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.email || null;
  } catch {
    return null;
  }
}
