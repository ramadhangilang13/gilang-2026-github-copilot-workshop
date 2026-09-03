import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../api';

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  };
}

function makePr(status, id) {
  return { id, prNumber: `PR-2026-000${id}`, status };
}

describe('api.getDashboard counting', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('counts requisitions per status', async () => {
    fetch.mockResolvedValue(
      jsonResponse({
        items: [
          makePr('DRAFT', 1),
          makePr('SUBMITTED', 2),
          makePr('APPROVED', 3),
          makePr('APPROVED', 4),
        ],
      })
    );

    const result = await api.getDashboard();

    expect(result.totalPr).toBe(4);
    expect(result.draftPr).toBe(1);
    expect(result.submittedPr).toBe(1);
    expect(result.approvedPr).toBe(2);
  });

  it('caps recentPr at five entries', async () => {
    const items = Array.from({ length: 8 }, (_, i) => makePr('DRAFT', i + 1));
    fetch.mockResolvedValue(jsonResponse({ items }));

    const result = await api.getDashboard();

    expect(result.totalPr).toBe(8);
    expect(result.recentPr).toHaveLength(5);
    expect(result.recentPr[0].id).toBe(1);
  });

  it('returns zeroed counts when the API omits items', async () => {
    fetch.mockResolvedValue(jsonResponse({}));

    const result = await api.getDashboard();

    expect(result).toEqual({
      totalPr: 0,
      draftPr: 0,
      submittedPr: 0,
      approvedPr: 0,
      recentPr: [],
    });
  });
});

describe('apiFetch error handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws the server-supplied message on a failed response', async () => {
    fetch.mockResolvedValue(
      jsonResponse({ message: 'Ordered qty exceeds remaining' }, { ok: false, status: 422 })
    );

    await expect(api.listRequisitions()).rejects.toThrow('Ordered qty exceeds remaining');
  });

  it('falls back to the status code when the body has no message', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => '' },
      json: async () => null,
    });

    await expect(api.listRequisitions()).rejects.toThrow('Request failed: 500');
  });
});
