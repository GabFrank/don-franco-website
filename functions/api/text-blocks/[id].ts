/**
 * Dynamic route handler para /api/text-blocks/:id
 * GET /api/text-blocks/:id - Obtener un text block
 * PUT /api/text-blocks/:id - Actualizar un text block
 * DELETE /api/text-blocks/:id - Eliminar un text block
 */

import { type Env } from '../../_shared/auth';
import { corsOptions } from '../../_shared/db-helpers';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../_shared/crud-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleGetById(context, {
    tableName: 'text_blocks',
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  return handleUpdateById(context, {
    tableName: 'text_blocks',
    updateableFields: ['body', 'visible', 'sort_order'],
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return handleDeleteById(context, {
    tableName: 'text_blocks',
  });
};
