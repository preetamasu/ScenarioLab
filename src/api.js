export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function send(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin', redirect: 'manual',
    signal: AbortSignal.timeout(20000), ...options,
  });
  if (response.type === 'opaqueredirect' || response.status === 401 || response.status === 302) {
    throw new ApiError('Your session has expired. Sign in again to continue.', 401);
  }
  return response;
}

// Existing backend has no /me endpoint. An owned-session lookup distinguishes
// authenticated JSON responses from Spring Security's login redirect.
export async function checkSession() {
  const response = await send('/api/v1/sessions/00000000-0000-0000-0000-000000000000');
  if (response.status === 404 || response.status === 403 || response.ok) return true;
  throw new ApiError('Cannot reach the backend. Check that Spring Boot is running.', response.status);
}

export async function getCsrf() {
  // Spring Security's existing GET /logout renders its CSRF-protected form.
  // Reading it does not log out; only POST /logout does that.
  const response = await send('/logout', { headers: { Accept: 'text/html' } });
  const document = new DOMParser().parseFromString(await response.text(), 'text/html');
  const token = document.querySelector('input[name="_csrf"]')?.value;
  if (!token) throw new ApiError('Could not load the security token. Please sign in again.', 401);
  return token;
}

export async function api(path, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    headers['X-CSRF-TOKEN'] = await getCsrf();
  }
  const response = await send(`/api/v1${path}`, {
    method: body === undefined ? 'GET' : 'POST', headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.detail || data.message || `Request failed (${response.status}).`, response.status);
  return data;
}

export async function signOut() {
  const token = await getCsrf();
  await send('/logout', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ _csrf: token }),
  }).catch(error => { if (error.status !== 401) throw error; });
}

export async function uploadAudio(url, blob) {
  const response = await fetch(url, {
    method: 'PUT', headers: { 'Content-Type': blob.type }, body: blob,
    credentials: 'omit', signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) throw new Error(`Audio upload failed (${response.status}). Check the S3 bucket's CORS configuration.`);
}
