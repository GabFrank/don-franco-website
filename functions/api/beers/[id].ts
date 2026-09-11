/**
 * Dynamic route handler para /api/beers/:id
 * GET /api/beers/:id - Obtener una cerveza
 * PUT /api/beers/:id - Actualizar una cerveza
 * DELETE /api/beers/:id - Eliminar una cerveza
 */

import { type Env } from '../../_shared/auth';
import { corsOptions } from '../../_shared/db-helpers';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../_shared/crud-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleGetById(context, {
    tableName: 'beers',
    selectQuery: `
      SELECT b.*, i.r2_key as image_r2_key, i.visible as image_visible
      FROM beers b
      LEFT JOIN images i ON b.image_id = i.id
      WHERE b.id = ?
    `,
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  return handleUpdateById(context, {
    tableName: 'beers',
    updateableFields: ['name', 'style', 'notes', 'image_id', 'visible', 'sort_order'],
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return handleDeleteById(context, {
    tableName: 'beers',
  });
};
