// API URL - configure via environment variable or default
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bdd-api.silverlinesoftware.co';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function fetchProjects() {
  return apiFetch('/api/projects');
}

export async function fetchRuns(projectId?: string) {
  const qs = projectId ? `?projectId=${projectId}` : '';
  return apiFetch(`/api/runs${qs}`);
}

export async function fetchRunDetail(runId: string) {
  return apiFetch(`/api/runs/${runId}`);
}

export async function fetchRunLogs(runId: string, offset = 0) {
  return apiFetch(`/api/runs/${runId}/logs?offset=${offset}`);
}

export async function triggerRun(body: {
  projectId: string;
  repo: string;
  tags: string[];
  branch?: string;
  makeTarget?: string;
}) {
  return apiFetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
