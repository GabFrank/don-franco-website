// API Types para Don Franco Admin

export interface TextBlock {
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

export interface Image {
  id: string;
  key: string;
  section: string;
  r2_key: string;
  alt: string | null;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Beer {
  id: string;
  name: string;
  style: string | null;
  notes: string | null;
  image_id: string | null;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  image?: Image;
}

export interface MenuCategory {
  id: string;
  title: string;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  badge: string | null;
  image_id: string | null;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  image?: Image;
  category?: MenuCategory;
}

export interface MenuPage {
  id: string;
  title: string;
  r2_key: string;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface GalleryImage {
  id: string;
  r2_key: string;
  alt: string | null;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ReviewQuote {
  id: string;
  author: string;
  text: string;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ReviewStats {
  id: number;
  rating: number;
  review_count: number;
  block_visible: number;
  updated_at: number;
}

export interface ContactInfo {
  id: number;
  whatsapp: string;
  address: string;
  hours: string;
  updated_at: number;
}

export interface Setting {
  key: string;
  value: string;
  description: string | null;
  updated_at: number;
}

export interface PublishLog {
  id: string;
  user_email: string;
  status: 'pending' | 'building' | 'completed' | 'failed';
  webhook_response: string | null;
  created_at: number;
  completed_at: number | null;
}

export interface UploadResponse {
  r2Key: string;
  filename: string;
  size: number;
  contentType: string;
  url: string;
}

export interface PublicContent {
  settings: Setting[];
  textBlocks: TextBlock[];
  images: Image[];
  beers: Beer[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  menuPages: MenuPage[];
  galleryImages: GalleryImage[];
  reviewQuotes: ReviewQuote[];
  reviewStats: ReviewStats;
  contactInfo: ContactInfo;
}
