/**
 * Dynamic route handler para /api/gallery-images/:id
 * GET /api/gallery-images/:id - Obtener una imagen de galería
 * PUT /api/gallery-images/:id - Actualizar una imagen de galería
 * DELETE /api/gallery-images/:id - Eliminar una imagen de galería
 */

import { type Env } from '../../_shared/auth';
import { corsOptions } from '../../_shared/db-helpers';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../_shared/crud-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleGetById(context, {
    tableName: 'gallery_images',
    selectQuery: `
      SELECT g.*, i.r2_key as image_r2_key, i.visible as image_visible
      FROM gallery_images g
      LEFT JOIN images i ON g.image_id = i.id
      WHERE g.id = ?
    `,
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  return handleUpdateById(context, {
    tableName: 'gallery_images',
    updateableFields: ['image_id', 'caption', 'visible', 'sort_order'],
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return handleDeleteById(context, {
    tableName: 'gallery_images',
  });
};
