/**
 * Dynamic route handler para /api/menu-items/:id
 * GET /api/menu-items/:id - Obtener un item del menú
 * PUT /api/menu-items/:id - Actualizar un item del menú
 * DELETE /api/menu-items/:id - Eliminar un item del menú
 */

import { type Env } from '../../_shared/auth';
import { corsOptions } from '../../_shared/db-helpers';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../_shared/crud-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleGetById(context, {
    tableName: 'menu_items',
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  return handleUpdateById(context, {
    tableName: 'menu_items',
    updateableFields: ['category_id', 'name', 'description', 'price', 'image_id', 'visible', 'sort_order'],
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return handleDeleteById(context, {
    tableName: 'menu_items',
  });
};
