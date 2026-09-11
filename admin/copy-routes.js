#!/usr/bin/env node

/**
 * Copy admin/index.html to nested route directories
 * This ensures Cloudflare Pages serves the SPA for direct navigation to admin routes
 */

import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ADMIN_ROUTES = [
  'textos',
  'menu',
  'cervezas',
  'galeria',
  'resenas',
  'contacto',
  'publicar',
];

const outDir = join(__dirname, '..', 'public', 'admin');
const sourceIndexPath = join(outDir, 'index.html');

console.log('[copy-routes] Copying admin index.html to nested route directories...');

ADMIN_ROUTES.forEach(route => {
  const routeDir = join(outDir, route);
  const targetIndexPath = join(routeDir, 'index.html');
  
  try {
    mkdirSync(routeDir, { recursive: true });
    copyFileSync(sourceIndexPath, targetIndexPath);
    console.log(`[copy-routes] ✓ ${route}/index.html`);
  } catch (error) {
    console.error(`[copy-routes] ✗ Failed to copy ${route}/index.html:`, error.message);
    process.exit(1);
  }
});

console.log(`[copy-routes] ✓ Done! Copied index.html to ${ADMIN_ROUTES.length} route directories.`);
