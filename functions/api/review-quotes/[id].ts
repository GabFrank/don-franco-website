/**
 * Dynamic route handler para /api/review-quotes/:id
 * GET /api/review-quotes/:id - Obtener una review quote
 * PUT /api/review-quotes/:id - Actualizar una review quote
 * DELETE /api/review-quotes/:id - Eliminar una review quote
 */

import { type Env } from '../../_shared/auth';
import { corsOptions } from '../../_shared/db-helpers';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../_shared/crud-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleGetById(context, {
    tableName: 'review_quotes',
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  return handleUpdateById(context, {
    tableName: 'review_quotes',
    updateableFields: ['author', 'text', 'rating', 'source', 'source_url', 'visible', 'sort_order'],
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return handleDeleteById(context, {
    tableName: 'review_quotes',
  });
};
