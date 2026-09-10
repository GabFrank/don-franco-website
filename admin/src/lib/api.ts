// API Client para Don Franco Admin
import type {
  TextBlock,
  Image,
  Beer,
  MenuCategory,
  MenuItem,
  MenuPage,
  GalleryImage,
  ReviewQuote,
  ReviewStats,
  ContactInfo,
  Setting,
  PublishLog,
  UploadResponse,
  PublicContent,
} from '../types/api';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const devSecret = localStorage.getItem('ADMIN_DEV_BYPASS_SECRET');
  if (devSecret) {
    headers['ADMIN_DEV_BYPASS_SECRET'] = devSecret;
  }
  
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  textBlocks: {
    list: (includeHidden = true, includeDeleted = false) =>
      fetch(
        `${API_BASE}/text-blocks?includeHidden=${includeHidden}&includeDeleted=${includeDeleted}`,
        { headers: getAuthHeaders() }
      ).then(handleResponse<TextBlock[]>),
    
    get: (id: string) =>
      fetch(`${API_BASE}/text-blocks/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<TextBlock>
      ),
    
    create: (data: Partial<TextBlock>) =>
      fetch(`${API_BASE}/text-blocks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<TextBlock>),
    
    update: (id: string, data: Partial<TextBlock>) =>
      fetch(`${API_BASE}/text-blocks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<TextBlock>),
    
    delete: (id: string, hard = false) =>
      fetch(`${API_BASE}/text-blocks/${id}?hard=${hard}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  images: {
    list: (includeHidden = true, includeDeleted = false) =>
      fetch(
        `${API_BASE}/images?includeHidden=${includeHidden}&includeDeleted=${includeDeleted}`,
        { headers: getAuthHeaders() }
      ).then(handleResponse<Image[]>),
    
    get: (id: string) =>
      fetch(`${API_BASE}/images/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<Image>
      ),
    
    create: (data: Partial<Image>) =>
      fetch(`${API_BASE}/images`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<Image>),
    
    update: (id: string, data: Partial<Image>) =>
      fetch(`${API_BASE}/images/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<Image>),
    
    delete: (id: string, hard = false) =>
      fetch(`${API_BASE}/images/${id}?hard=${hard}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  beers: {
    list: (includeHidden = true, includeDeleted = false) =>
      fetch(
        `${API_BASE}/beers?includeHidden=${includeHidden}&includeDeleted=${includeDeleted}`,
        { headers: getAuthHeaders() }
      ).then(handleResponse<Beer[]>),
    
    get: (id: string) =>
      fetch(`${API_BASE}/beers/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<Beer>
      ),
    
    create: (data: Partial<Beer>) =>
      fetch(`${API_BASE}/beers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<Beer>),
    
    update: (id: string, data: Partial<Beer>) =>
      fetch(`${API_BASE}/beers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<Beer>),
    
    delete: (id: string, hard = false) =>
      fetch(`${API_BASE}/beers/${id}?hard=${hard}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  menuCategories: {
    list: (includeHidden = true, includeDeleted = false) =>
      fetch(
        `${API_BASE}/menu-categories?includeHidden=${includeHidden}&includeDeleted=${includeDeleted}`,
        { headers: getAuthHeaders() }
      ).then(handleResponse<MenuCategory[]>),
    
    get: (id: string) =>
      fetch(`${API_BASE}/menu-categories/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<MenuCategory>
      ),
    
    create: (data: Partial<MenuCategory>) =>
      fetch(`${API_BASE}/menu-categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<MenuCategory>),
    
    update: (id: string, data: Partial<MenuCategory>) =>
      fetch(`${API_BASE}/menu-categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<MenuCategory>),
    
    delete: (id: string, hard = false) =>
      fetch(`${API_BASE}/menu-categories/${id}?hard=${hard}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  menuItems: {
    list: (includeHidden = true, includeDeleted = false, categoryId?: string) => {
      let url = `${API_BASE}/menu-items?includeHidden=${includeHidden}&includeDeleted=${includeDeleted}`;
      if (categoryId) url += `&category_id=${categoryId}`;
      return fetch(url, { headers: getAuthHeaders() }).then(
        handleResponse<MenuItem[]>
      );
    },
    
    get: (id: string) =>
      fetch(`${API_BASE}/menu-items/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<MenuItem>
      ),
    
    create: (data: Partial<MenuItem>) =>
      fetch(`${API_BASE}/menu-items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<MenuItem>),
    
    update: (id: string, data: Partial<MenuItem>) =>
      fetch(`${API_BASE}/menu-items/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<MenuItem>),
    
    delete: (id: string, hard = false) =>
      fetch(`${API_BASE}/menu-items/${id}?hard=${hard}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  menuPages: {
    list: (includeHidden = true, includeDeleted = false) =>
      fetch(
        `${API_BASE}/menu-pages?includeHidden=${includeHidden}&includeDeleted=${includeDeleted}`,
        { headers: getAuthHeaders() }
      ).then(handleResponse<MenuPage[]>),
    
    get: (id: string) =>
      fetch(`${API_BASE}/menu-pages/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<MenuPage>
      ),
    
    create: (data: Partial<MenuPage>) =>
      fetch(`${API_BASE}/menu-pages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<MenuPage>),
    
    update: (id: string, data: Partial<MenuPage>) =>
      fetch(`${API_BASE}/menu-pages/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<MenuPage>),
    
    delete: (id: string, hard = false) =>
      fetch(`${API_BASE}/menu-pages/${id}?hard=${hard}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  galleryImages: {
    list: (includeHidden = true, includeDeleted = false) =>
      fetch(
        `${API_BASE}/gallery-images?includeHidden=${includeHidden}&includeDeleted=${includeDeleted}`,
        { headers: getAuthHeaders() }
      ).then(handleResponse<GalleryImage[]>),
    
    get: (id: string) =>
      fetch(`${API_BASE}/gallery-images/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<GalleryImage>
      ),
    
    create: (data: Partial<GalleryImage>) =>
      fetch(`${API_BASE}/gallery-images`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<GalleryImage>),
    
    update: (id: string, data: Partial<GalleryImage>) =>
      fetch(`${API_BASE}/gallery-images/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<GalleryImage>),
    
    delete: (id: string, hard = false) =>
      fetch(`${API_BASE}/gallery-images/${id}?hard=${hard}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  reviewQuotes: {
    list: (includeHidden = true, includeDeleted = false) =>
      fetch(
        `${API_BASE}/review-quotes?includeHidden=${includeHidden}&includeDeleted=${includeDeleted}`,
        { headers: getAuthHeaders() }
      ).then(handleResponse<ReviewQuote[]>),
    
    get: (id: string) =>
      fetch(`${API_BASE}/review-quotes/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<ReviewQuote>
      ),
    
    create: (data: Partial<ReviewQuote>) =>
      fetch(`${API_BASE}/review-quotes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<ReviewQuote>),
    
    update: (id: string, data: Partial<ReviewQuote>) =>
      fetch(`${API_BASE}/review-quotes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<ReviewQuote>),
    
    delete: (id: string, hard = false) =>
      fetch(`${API_BASE}/review-quotes/${id}?hard=${hard}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  reviewStats: {
    get: () =>
      fetch(`${API_BASE}/review-stats`, { headers: getAuthHeaders() }).then(
        handleResponse<ReviewStats>
      ),
    
    update: (data: Partial<ReviewStats>) =>
      fetch(`${API_BASE}/review-stats`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<ReviewStats>),
  },

  contactInfo: {
    get: () =>
      fetch(`${API_BASE}/contact-info`, { headers: getAuthHeaders() }).then(
        handleResponse<ContactInfo>
      ),
    
    update: (data: Partial<ContactInfo>) =>
      fetch(`${API_BASE}/contact-info`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<ContactInfo>),
  },

  settings: {
    list: () =>
      fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() }).then(
        handleResponse<Setting[]>
      ),
    
    get: (key: string) =>
      fetch(`${API_BASE}/settings/${key}`, { headers: getAuthHeaders() }).then(
        handleResponse<Setting>
      ),
    
    update: (key: string, value: string) =>
      fetch(`${API_BASE}/settings/${key}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ value }),
      }).then(handleResponse<Setting>),
    
    delete: (key: string) =>
      fetch(`${API_BASE}/settings/${key}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean }>),
  },

  publish: {
    trigger: () =>
      fetch(`${API_BASE}/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
      }).then(handleResponse<PublishLog>),
    
    getLog: () =>
      fetch(`${API_BASE}/publish`, { headers: getAuthHeaders() }).then(
        handleResponse<PublishLog[]>
      ),
    
    getStatus: (id: string) =>
      fetch(`${API_BASE}/publish/${id}`, { headers: getAuthHeaders() }).then(
        handleResponse<PublishLog>
      ),
  },

  r2: {
    upload: async (file: File, folder: string = ''): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) formData.append('folder', folder);
      
      const headers: HeadersInit = {};
      const devSecret = localStorage.getItem('ADMIN_DEV_BYPASS_SECRET');
      if (devSecret) {
        headers['ADMIN_DEV_BYPASS_SECRET'] = devSecret;
      }
      
      const response = await fetch(`${API_BASE}/r2/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      return handleResponse<UploadResponse>(response);
    },
  },

  public: {
    getContent: () =>
      fetch(`${API_BASE}/public/content`).then(handleResponse<PublicContent>),
  },
};
