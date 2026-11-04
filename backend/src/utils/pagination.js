export function getPagination({ page = 1, limit = 20 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

export function paginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 0;
  return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}
