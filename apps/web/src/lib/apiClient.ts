const API_BASE = (import.meta.env.VITE_API_URL || '').trim();
// Prefer a local backend during development when running on localhost
const FALLBACK_BACKEND = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:4000'
  : '';

export const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('token') || '';
};

async function tryFetch(url: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init);
  } catch (err) {
    return null;
  }
}

export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers || {});
  const hasBody = typeof options.body !== 'undefined' && options.body !== null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  

  const init: RequestInit = {
    ...options,
    headers,
  };

  const primaryUrl = `${API_BASE}${path}`;
  const resp = await tryFetch(primaryUrl, init);
  // If primary fetch failed (network) try fallback
  if (!resp) {
    if (FALLBACK_BACKEND) {
      const fallbackUrl = `${FALLBACK_BACKEND}${path}`;
      const fallbackResp = await tryFetch(fallbackUrl, init);
      if (fallbackResp) return fallbackResp;
    }
    throw new Error('Network request failed to API (primary and fallback)');
  }

  // If primary responded with OK, return
  if (resp.ok) return resp;

  // If primary returned a server error or not found, try fallback host
  if (resp.status >= 500 || resp.status === 404) {
    if (typeof window !== 'undefined') {
      const fallbackUrl = `${FALLBACK_BACKEND}${path}`;
      const fallbackResp = await tryFetch(fallbackUrl, init);
      if (fallbackResp) return fallbackResp;
    }
  }

  // Otherwise return the primary response (e.g., 401/403/client errors)
  return resp;
};
export function isProtectedUploadUrl(value: string) {
  try {
    const url = new URL(value, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    const apiOrigin = API_BASE && typeof window !== 'undefined'
      ? new URL(API_BASE, window.location.origin).origin
      : (typeof window === 'undefined' ? '' : window.location.origin);
    const isKnownOrigin = url.origin === apiOrigin
      || (typeof window !== 'undefined' && url.origin === window.location.origin);
    return isKnownOrigin && /^\/(?:api\/)?uploads\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(url.pathname);
  } catch {
    return false;
  }
}

export async function openResourceUrl(value: string) {
  if (!isProtectedUploadUrl(value)) {
    window.open(value, '_blank', 'noopener,noreferrer');
    return;
  }

  const parsedUrl = new URL(value, window.location.origin);
  const filename = parsedUrl.pathname.split('/').pop();
  if (!filename) {
    throw new Error('The uploaded file URL is invalid.');
  }

  const popup = window.open('about:blank', '_blank');
  if (!popup) {
    throw new Error('Allow pop-ups for StudyLink to open this file.');
  }
  popup.opener = null;

  try {
    const response = await apiFetch(`/api/uploads/${encodeURIComponent(filename)}`);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || 'The uploaded file could not be opened.');
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    popup.location.replace(objectUrl);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    popup.close();
    throw error;
  }
}
