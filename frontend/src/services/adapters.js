/**
 * Response-handling layer. The API documentation lists endpoints but NOT response envelopes, so
 * every service funnels responses through these helpers. If the real envelope differs, fix it here.
 *
 * Handles: `{data: X}`, `{success, data: X}`, bare `X`, and lists under data/items/results/docs/<key>.
 */
export const unwrap = (res) => {
  const body = res?.data;
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) return body.data;
  return body;
};

export const toList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const k of [...keys, 'items', 'results', 'docs', 'rows', 'list', 'data']) {
    if (Array.isArray(payload[k])) return payload[k];
  }
  for (const v of Object.values(payload)) if (Array.isArray(v)) return v;
  return [];
};

export const toPage = (res, keys = []) => {
  const body = res?.data || {};
  const payload = unwrap(res);
  const items = toList(payload, keys);
  const meta = payload?.pagination || payload?.meta || body?.pagination || body?.meta || {};
  return {
    items,
    total: meta.total ?? meta.totalItems ?? payload?.total ?? body?.total ?? items.length,
    page: meta.page ?? meta.currentPage ?? payload?.page ?? 1,
    pages: meta.pages ?? meta.totalPages ?? payload?.totalPages ?? 1,
  };
};

/** Pull a single entity out of `{user: {...}}`-style wrappers. */
export const toEntity = (payload, keys = []) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    for (const k of keys) if (payload[k] && typeof payload[k] === 'object') return payload[k];
  }
  return payload;
};

export const getErrorMessage = (e, fallback = 'Something went wrong. Please try again.') => {
  const d = e?.response?.data;
  if (d?.message && typeof d.message === 'string') return d.message;
  if (typeof d?.error === 'string') return d.error;
  if (d?.errors?.[0]?.message) return d.errors[0].message;
  if (e?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the backend is running.';
  if (e?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  return e?.message || fallback;
};

/** Drop empty-string/undefined params so they are not sent as `?search=`. */
export const cleanParams = (p = {}) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v !== undefined && v !== null && v !== 'all'));
