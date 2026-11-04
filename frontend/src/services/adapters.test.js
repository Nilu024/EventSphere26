import { describe, it, expect } from 'vitest';
import { unwrap, toList, toPage, getErrorMessage, cleanParams } from './adapters';

describe('adapters', () => {
  it('unwraps {data} envelopes and bare bodies', () => {
    expect(unwrap({ data: { success: true, data: { a: 1 } } })).toEqual({ a: 1 });
    expect(unwrap({ data: [1, 2] })).toEqual([1, 2]);
  });
  it('extracts lists from common shapes', () => {
    expect(toList([1])).toEqual([1]);
    expect(toList({ events: [1, 2] }, ['events'])).toEqual([1, 2]);
    expect(toList({ items: [3] })).toEqual([3]);
    expect(toList({ nested: [9] })).toEqual([9]);
    expect(toList(null)).toEqual([]);
  });
  it('builds pagination metadata with sane defaults', () => {
    const p = toPage({ data: { data: { events: [1, 2], pagination: { total: 20, page: 2, pages: 4 } } } }, ['events']);
    expect(p.items).toHaveLength(2); expect(p.total).toBe(20); expect(p.page).toBe(2); expect(p.pages).toBe(4);
    expect(toPage({ data: [1] }).pages).toBe(1);
  });
  it('prefers server messages and explains network failures', () => {
    expect(getErrorMessage({ response: { data: { message: 'Nope' } } })).toBe('Nope');
    expect(getErrorMessage({ code: 'ERR_NETWORK' })).toContain('Cannot reach the server');
  });
  it('drops empty params', () => {
    expect(cleanParams({ a: '', b: 'x', c: undefined, d: 'all', e: 0 })).toEqual({ b: 'x', e: 0 });
  });
});
