/**
 * Dynamic route handler para /api/menu-categories/:id
 * GET /api/menu-categories/:id - Obtener una categoría
 * PUT /api/menu-categories/:id - Actualizar una categoría
 * DELETE /api/menu-categories/:id - Eliminar una categoría
 */

import { type Env } from '../../_shared/auth';
import { corsOptions } from '../../_shared/db-helpers';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../_shared/crud-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleGetById(context, {
    tableName: 'menu_categories',
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  return handleUpdateById(context, {
    tableName: 'menu_categories',
    updateableFields: ['name', 'description', 'visible', 'sort_order'],
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return handleDeleteById(context, {
    tableName: 'menu_categories',
  });
};
