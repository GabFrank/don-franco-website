/**
 * Dynamic route handler para /api/menu-pages/:id
 * GET /api/menu-pages/:id - Obtener una página de menú
 * PUT /api/menu-pages/:id - Actualizar una página de menú
 * DELETE /api/menu-pages/:id - Eliminar una página de menú
 */

import { type Env } from '../../_shared/auth';
import { corsOptions } from '../../_shared/db-helpers';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../_shared/crud-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleGetById(context, {
    tableName: 'menu_pages',
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  return handleUpdateById(context, {
    tableName: 'menu_pages',
    updateableFields: ['slug', 'title', 'description', 'image_id', 'visible', 'sort_order'],
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return handleDeleteById(context, {
    tableName: 'menu_pages',
  });
};
