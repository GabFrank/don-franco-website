export interface MenuImage {
  fileId: string;
  url: string;
}

export interface MenuItem {
  id: string;
  title: string;
  description?: string;
  image: MenuImage;
  alt: string;
  isFeatured?: boolean;
}

export interface MenuCategory {
  id: string;
  title: string;
  order: number;
  items: MenuItem[];
}

export interface MenuIndex {
  updatedAt: string;
  menuVersion: string;
  categories: MenuCategory[];
}
