/** Normalise a skill/interest term: Unicode-normalised, trimmed, lower-cased, inner whitespace collapsed. */
export const normalizeTerm = (t) => String(t).normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');

/** Normalise + de-duplicate a list of skills/interests (max 30). */
export function normalizeList(list = [], { maxItems = 30 } = {}) {
  const out = new Set();
  for (const item of list || []) {
    if (typeof item !== 'string') continue;
    const n = normalizeTerm(item);
    if (n) out.add(n);
  }
  return [...out].slice(0, maxItems);
}

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
