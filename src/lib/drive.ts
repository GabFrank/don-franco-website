/**
 * Google blocked drive.google.com/uc?export=view URLs for external embedding
 * since Jan 2024. The working alternative is the thumbnail service:
 * https://lh3.googleusercontent.com/d/FILE_ID
 *
 * Reference: https://labnol.org/google-drive-image-hosting-220515
 */
const DRIVE_THUMBNAIL_BASE = "https://lh3.googleusercontent.com/d/";
const DRIVE_DOWNLOAD_BASE = "https://drive.google.com/uc?export=download&id=";

/**
 * Build direct view URL for a public Google Drive file (e.g. PNG A4 menu page).
 * Uses lh3.googleusercontent.com thumbnail service (works as of 2025+).
 */
export function buildDriveViewUrl(fileId: string): string {
  return `${DRIVE_THUMBNAIL_BASE}${encodeURIComponent(fileId)}`;
}

/**
 * Build download URL for a public Google Drive file.
 */
export function buildDriveDownloadUrl(fileId: string): string {
  return `${DRIVE_DOWNLOAD_BASE}${encodeURIComponent(fileId)}`;
}

/**
 * Ensure menu item image has a valid url from fileId if missing.
 */
export function normalizeMenuItemImage(item: { image: { fileId: string; url?: string } }): { fileId: string; url: string } {
  const { fileId, url } = item.image;
  return {
    fileId,
    url: url && url.startsWith("http") ? url : buildDriveViewUrl(fileId),
  };
}

const DRIVE_FILE_LINK = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;

/**
 * Resolve image URL for a menu page: accepts either fileId or full URL (Drive share link or direct image URL).
 */
export function getMenuPageImageUrl(page: { fileId?: string; url?: string }): string {
  const url = page.url?.trim();
  if (url && url.startsWith("http")) {
    const match = url.match(DRIVE_FILE_LINK);
    if (match) return buildDriveViewUrl(match[1]);
    return url;
  }
  if (page.fileId?.trim()) return buildDriveViewUrl(page.fileId.trim());
  return "";
}
