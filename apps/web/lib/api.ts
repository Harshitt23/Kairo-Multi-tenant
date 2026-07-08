import { useAuthStore } from './auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  orgSlug?: string;
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // De-dupe concurrent 401s into a single refresh round-trip.
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      useAuthStore.getState().setAuth(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// 401s where the caller shows the error inline instead of bouncing to /login.
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

/** Session is gone (refresh failed): clear state and send the user to /login. */
function redirectToLogin(apiPath: string) {
  if (typeof window === 'undefined') return;
  if (AUTH_PATHS.includes(apiPath)) return;
  const { pathname, search } = window.location;
  if (pathname.startsWith('/login')) return;
  useAuthStore.getState().clear();
  window.location.assign(`/login?next=${encodeURIComponent(pathname + search)}`);
}

async function request<T>(path: string, opts: RequestOptions = {}, retry = true): Promise<T> {
  const { body, orgSlug, headers, ...rest } = opts;
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/api${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(orgSlug ? { 'x-org-slug': orgSlug } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    const fresh = await refreshAccessToken();
    if (fresh) return request<T>(path, opts, false);
    redirectToLogin(path);
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (errBody as { message?: string }).message ?? res.statusText, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, orgSlug?: string) => request<T>(path, { method: 'GET', orgSlug }),
  post: <T>(path: string, body?: unknown, orgSlug?: string) =>
    request<T>(path, { method: 'POST', body, orgSlug }),
  patch: <T>(path: string, body?: unknown, orgSlug?: string) =>
    request<T>(path, { method: 'PATCH', body, orgSlug }),
  delete: <T>(path: string, orgSlug?: string) =>
    request<T>(path, { method: 'DELETE', orgSlug }),
};

export interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  createdAt: string;
  uploader: { id: string; name: string; avatarUrl: string | null };
}

/**
 * Three-step attachment upload: ask the API for a presigned PUT URL, upload the
 * bytes straight to S3 (the API never touches the file), then confirm so the
 * row is persisted. Returns the created attachment with a download URL.
 */
export async function uploadAttachment(
  orgSlug: string,
  issueId: string,
  file: File,
): Promise<Attachment> {
  const base = `/orgs/${orgSlug}/issues/${issueId}/attachments`;
  const { uploadUrl, fileKey } = await api.post<{ uploadUrl: string; fileKey: string }>(
    `${base}/presign`,
    { fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size },
    orgSlug,
  );

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!put.ok) throw new ApiError(put.status, 'Upload to storage failed');

  return api.post<Attachment>(
    base,
    {
      fileKey,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    },
    orgSlug,
  );
}

export { API_URL };
