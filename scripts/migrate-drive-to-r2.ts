/**
 * Script de migración Drive → R2
 * 
 * Lee site.json y menu-pages.json, descarga assets desde Google Drive
 * y los sube a R2 con naming estable. Genera SQL seed para tablas:
 * - images (hero backgrounds, gallery fallbacks)
 * - menu_pages (PNG carta física)
 * 
 * Requiere variables de entorno:
 *   - GOOGLE_DRIVE_API_KEY (opcional — si no está, solo genera estructura sin descargar)
 *   - CLOUDFLARE_ACCOUNT_ID
 *   - CLOUDFLARE_API_TOKEN (con permisos R2)
 *   - R2_BUCKET_NAME (default: don-franco-media)
 * 
 * Uso:
 *   npm run migrate:drive-to-r2
 *   npm run migrate:drive-to-r2 -- --dry-run
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Interfaz de configuración
interface Config {
  dryRun: boolean;
  driveApiKey?: string;
  accountId?: string;
  apiToken?: string;
  bucketName: string;
}

interface DriveFile {
  driveUrl: string;
  r2Key: string;
  section: string;
  contentType: string;
}

interface MigrationResult {
  images: Array<{ key: string; r2Key: string; section: string; alt?: string }>;
  menuPages: Array<{ title: string; r2Key: string; order: number }>;
  errors: string[];
}

// Parsear argumentos
const args = process.argv.slice(2);
const config: Config = {
  dryRun: args.includes('--dry-run'),
  driveApiKey: process.env.GOOGLE_DRIVE_API_KEY,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  bucketName: process.env.R2_BUCKET_NAME || 'don-franco-media'
};

console.log('🚀 Iniciando migración Drive → R2');
console.log(`   Modo: ${config.dryRun ? 'DRY RUN (sin descarga/upload)' : 'PRODUCCIÓN'}`);
console.log(`   Bucket R2: ${config.bucketName}\n`);

// Extraer file ID de URL de Drive
function extractDriveFileId(url: string): string | null {
  // Formato 1: /file/d/{id}/view
  let match = url.match(/\/file\/d\/([^/]+)/);
  if (match) return match[1];
  
  // Formato 2: ID directo (fallback images en site.json)
  if (url.length > 20 && !url.includes('/')) return url;
  
  return null;
}

// Descargar archivo desde Drive (requiere API key)
async function downloadDriveFile(fileId: string): Promise<Buffer> {
  if (!config.driveApiKey) {
    throw new Error('GOOGLE_DRIVE_API_KEY no configurado');
  }
  
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${config.driveApiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download falló [${response.status}]: ${response.statusText}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}

// Subir a R2 vía API REST
async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (!config.accountId || !config.apiToken) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN requeridos');
  }
  
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucketName}/objects/${key}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': contentType,
    },
    body: buffer,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`R2 upload falló [${response.status}]: ${error}`);
  }
}

// Generar UUID simple
function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Escapar comillas para SQL
function sqlEscape(str: string): string {
  return str.replace(/'/g, "''");
}

// Migrar archivos
async function migrate(): Promise<MigrationResult> {
  const result: MigrationResult = { images: [], menuPages: [], errors: [] };
  
  // Leer JSON sources
  const contentDir = join(process.cwd(), 'src/content');
  const siteData = JSON.parse(readFileSync(join(contentDir, 'site.json'), 'utf-8'));
  const menuPagesData = JSON.parse(readFileSync(join(contentDir, 'menu-pages.json'), 'utf-8'));
  
  // ============================================================
  // 1. Hero background images
  // ============================================================
  console.log('📸 Procesando hero backgrounds...');
  for (let i = 0; i < siteData.hero.backgroundImages.length; i++) {
    const driveUrl = siteData.hero.backgroundImages[i];
    const fileId = extractDriveFileId(driveUrl);
    
    if (!fileId) {
      result.errors.push(`Hero BG ${i}: URL inválida ${driveUrl}`);
      continue;
    }
    
    const r2Key = `hero-backgrounds/bg-${String(i + 1).padStart(2, '0')}.jpg`;
    
    try {
      if (!config.dryRun) {
        const buffer = await downloadDriveFile(fileId);
        await uploadToR2(r2Key, buffer, 'image/jpeg');
      }
      
      result.images.push({
        key: `hero.bg.${i}`,
        r2Key,
        section: 'hero_bg',
        alt: `Hero background ${i + 1}`
      });
      
      console.log(`   ✓ ${r2Key} ${config.dryRun ? '(dry-run)' : ''}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Hero BG ${i}: ${errMsg}`);
      console.error(`   ✗ ${r2Key}: ${errMsg}`);
    }
  }
  
  // ============================================================
  // 2. Menu pages (PNG carta física)
  // ============================================================
  console.log('\n📄 Procesando menu pages...');
  for (let i = 0; i < menuPagesData.pages.length; i++) {
    const page = menuPagesData.pages[i];
    const fileId = extractDriveFileId(page.url);
    
    if (!fileId) {
      result.errors.push(`Menu page ${i}: URL inválida ${page.url}`);
      continue;
    }
    
    const r2Key = `menu-pages/page-${String(i + 1).padStart(2, '0')}.png`;
    
    try {
      if (!config.dryRun) {
        const buffer = await downloadDriveFile(fileId);
        await uploadToR2(r2Key, buffer, 'image/png');
      }
      
      result.menuPages.push({
        title: page.alt || `Página ${i + 1}`,
        r2Key,
        order: i
      });
      
      console.log(`   ✓ ${r2Key} ${config.dryRun ? '(dry-run)' : ''}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Menu page ${i}: ${errMsg}`);
      console.error(`   ✗ ${r2Key}: ${errMsg}`);
    }
  }
  
  // ============================================================
  // 3. Gallery fallback images (si existen)
  // ============================================================
  if (siteData.gallery?.fallbackImages?.length) {
    console.log('\n🖼️  Procesando gallery fallbacks...');
    for (let i = 0; i < siteData.gallery.fallbackImages.length; i++) {
      const fileId = siteData.gallery.fallbackImages[i];
      const r2Key = `gallery/img-${uuid()}.jpg`;
      
      try {
        if (!config.dryRun) {
          const buffer = await downloadDriveFile(fileId);
          await uploadToR2(r2Key, buffer, 'image/jpeg');
        }
        
        result.images.push({
          key: `gallery.fallback.${i}`,
          r2Key,
          section: 'gallery',
          alt: `Galería ${i + 1}`
        });
        
        console.log(`   ✓ ${r2Key} ${config.dryRun ? '(dry-run)' : ''}`);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Gallery ${i}: ${errMsg}`);
        console.error(`   ✗ ${r2Key}: ${errMsg}`);
      }
    }
  }
  
  return result;
}

// Generar SQL seed para images y menu_pages
function generateSeedSQL(result: MigrationResult): string {
  let sql = `-- ============================================================
-- MIGRATION SEED: Images + Menu Pages
-- Generado por migrate-drive-to-r2.ts
-- Fecha: ${new Date().toISOString()}
-- ============================================================

`;
  
  // Images
  if (result.images.length > 0) {
    sql += `-- IMAGES (hero backgrounds, gallery)\n`;
    sql += `INSERT INTO images (id, key, section, r2_key, alt, visible, sort_order) VALUES\n`;
    sql += result.images.map((img, i) => 
      `  ('${uuid()}', '${img.key}', '${img.section}', '${img.r2Key}', ${img.alt ? `'${sqlEscape(img.alt)}'` : 'NULL'}, 1, ${i})`
    ).join(',\n');
    sql += `;\n\n`;
  }
  
  // Menu pages
  if (result.menuPages.length > 0) {
    sql += `-- MENU PAGES (PNG carta física)\n`;
    sql += `INSERT INTO menu_pages (id, title, r2_key, visible, sort_order) VALUES\n`;
    sql += result.menuPages.map(page => 
      `  ('${uuid()}', '${sqlEscape(page.title)}', '${page.r2Key}', 1, ${page.order})`
    ).join(',\n');
    sql += `;\n`;
  }
  
  return sql;
}

// Main
(async () => {
  try {
    // Validar credenciales si no es dry-run
    if (!config.dryRun) {
      if (!config.driveApiKey) {
        console.warn('⚠️  GOOGLE_DRIVE_API_KEY no configurado — descarga desde Drive deshabilitada');
        console.warn('   Continuando en modo estructura (sin download)...\n');
      }
      if (!config.accountId || !config.apiToken) {
        throw new Error('CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN requeridos para upload a R2');
      }
    }
    
    const result = await migrate();
    
    console.log('\n✅ Migración completada');
    console.log(`   Imágenes procesadas: ${result.images.length}`);
    console.log(`   Páginas menú procesadas: ${result.menuPages.length}`);
    
    if (result.errors.length > 0) {
      console.error(`\n⚠️  Errores encontrados (${result.errors.length}):`);
      result.errors.forEach(err => console.error(`   - ${err}`));
    }
    
    // Generar seed SQL
    const seedSQL = generateSeedSQL(result);
    const outputPath = join(process.cwd(), 'ops/d1/migration-seed.sql');
    
    // Crear directorio si no existe
    const outputDir = join(process.cwd(), 'ops/d1');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    writeFileSync(outputPath, seedSQL, 'utf-8');
    console.log(`\n📝 Seed SQL generado: ${outputPath}`);
    console.log('\nPara aplicar el seed:');
    console.log(`   wrangler d1 execute don-franco-content --file=${outputPath}`);
    
    if (result.errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migración falló:', error);
    process.exit(1);
  }
})();
