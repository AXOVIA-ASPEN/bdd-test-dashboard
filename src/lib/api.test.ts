import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProjects, fetchRuns, fetchRunDetail, fetchRunLogs, triggerRun, API_URL } from './api';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function okResponse(data: unknown) {
  return { ok: true, json: () => Promise.resolve(data) };
}

function errorResponse(status: number, body?: object) {
  return { ok: false, status, json: () => Promise.resolve(body || {}) };
}

describe('API_URL', () => {
  it('has a default value', () => {
    expect(API_URL).toBeTruthy();
  });
});

describe('fetchProjects', () => {
  it('calls GET /api/projects', async () => {
    const data = [{ id: 'p1' }];
    mockFetch.mockResolvedValue(okResponse(data));
    const result = await fetchProjects();
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/api/projects`, undefined);
    expect(result).toEqual(data);
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue(errorResponse(500, { error: 'Server error' }));
    await expect(fetchProjects()).rejects.toThrow('Server error');
  });

  it('throws generic message when no error body', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: () => Promise.reject() });
    await expect(fetchProjects()).rejects.toThrow('API error 404');
  });
});

describe('fetchRuns', () => {
  it('calls GET /api/runs without projectId', async () => {
    mockFetch.mockResolvedValue(okResponse([]));
    await fetchRuns();
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/api/runs`, undefined);
  });

  it('calls GET /api/runs with projectId', async () => {
    mockFetch.mockResolvedValue(okResponse([]));
    await fetchRuns('p1');
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/api/runs?projectId=p1`, undefined);
  });
});

describe('fetchRunDetail', () => {
  it('calls GET /api/runs/:id', async () => {
    mockFetch.mockResolvedValue(okResponse({ id: 'r1' }));
    const result = await fetchRunDetail('r1');
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/api/runs/r1`, undefined);
    expect(result.id).toBe('r1');
  });
});

describe('fetchRunLogs', () => {
  it('calls with offset', async () => {
    mockFetch.mockResolvedValue(okResponse({ logs: [] }));
    await fetchRunLogs('r1', 50);
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/api/runs/r1/logs?offset=50`, undefined);
  });

  it('defaults offset to 0', async () => {
    mockFetch.mockResolvedValue(okResponse({ logs: [] }));
    await fetchRunLogs('r1');
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/api/runs/r1/logs?offset=0`, undefined);
  });
});

describe('triggerRun', () => {
  it('calls POST /api/runs with body', async () => {
    mockFetch.mockResolvedValue(okResponse({ id: 'new' }));
    const body = { projectId: 'p1', repo: 'org/p1', tags: ['smoke'], branch: 'main' };
    await triggerRun(body);
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  });
});
