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
const DRIVE_FOLDER_LINK = /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/;
const DRIVE_OPEN_QUERY_ID = /[?&]id=([a-zA-Z0-9_-]+)/;

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

/**
 * Get folder id from either direct folder id or a Google Drive folder URL.
 */
export function getDriveFolderId(input?: string): string {
  const raw = input?.trim() ?? "";
  if (!raw) return "";
  if (!raw.includes("http")) return raw;
  const folderMatch = raw.match(DRIVE_FOLDER_LINK);
  if (folderMatch?.[1]) return folderMatch[1];
  const queryMatch = raw.match(DRIVE_OPEN_QUERY_ID);
  if (queryMatch?.[1]) return queryMatch[1];
  return "";
}

export interface DriveFolderImage {
  url: string;
  alt: string;
  link?: string;
}

interface FetchDriveFolderImagesParams {
  apiKey?: string;
  folder?: string;
  limit?: number;
}

function normalizeAltFromName(name: string): string {
  const withoutExt = name.replace(/\.[a-zA-Z0-9]+$/, "");
  return withoutExt.trim() || "Imagen de galería";
}

/**
 * Fetch latest images from a public Drive folder using Drive API v3.
 * Returns [] when params are missing or request fails.
 */
export async function fetchDriveFolderImages({
  apiKey,
  folder,
  limit = 12,
}: FetchDriveFolderImagesParams): Promise<DriveFolderImage[]> {
  const key = apiKey?.trim();
  const folderId = getDriveFolderId(folder);
  if (!key || !folderId) return [];

  try {
    const q = `'${folderId}' in parents and trashed=false and mimeType contains 'image/'`;
    const params = new URLSearchParams({
      key,
      q,
      fields: "files(id,name,webViewLink,createdTime)",
      orderBy: "createdTime desc",
      pageSize: String(Math.max(1, Math.min(limit, 100))),
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
    });
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
    if (!res.ok) return [];
    const json = (await res.json()) as {
      files?: Array<{ id: string; name: string; webViewLink?: string; createdTime?: string }>;
    };
    const files = json.files ?? [];
    return files.map((file) => ({
      url: buildDriveViewUrl(file.id),
      alt: normalizeAltFromName(file.name),
      link: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    }));
  } catch {
    return [];
  }
}
