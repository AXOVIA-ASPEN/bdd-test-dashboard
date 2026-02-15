export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function handleResponse(res: Response) {
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchProjects(init?: RequestInit) {
  const res = await fetch(`${API_URL}/api/projects`, init);
  return handleResponse(res);
}

export async function fetchRuns(projectId?: string, init?: RequestInit) {
  const url = projectId
    ? `${API_URL}/api/runs?projectId=${projectId}`
    : `${API_URL}/api/runs`;
  const res = await fetch(url, init);
  return handleResponse(res);
}

export async function fetchRunDetail(runId: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}/api/runs/${runId}`, init);
  return handleResponse(res);
}

export async function fetchRunLogs(runId: string, offset = 0, init?: RequestInit) {
  const res = await fetch(`${API_URL}/api/runs/${runId}/logs?offset=${offset}`, init);
  return handleResponse(res);
}

export async function triggerRun(body: { projectId: string; repo: string; tags: string[]; branch: string }) {
  const res = await fetch(`${API_URL}/api/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}
