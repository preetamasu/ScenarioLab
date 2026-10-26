export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function send(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    ...options,
  });
  if (
    response.type === "opaqueredirect" ||
    response.status === 401 ||
    response.status === 302
  ) {
    throw new ApiError(
      "Your session has expired. Sign in again to continue.",
      401,
    );
  }
  return response;
}

async function getAuthStatus() {
  const response = await send("/api/v1/auth/status", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new ApiError(
      "The backend login-status endpoint is unavailable. Restart the updated Spring Boot application.",
      response.status,
    );
  }
  const status = await response.json().catch(() => null);
  if (!status || typeof status.authenticated !== "boolean") {
    throw new ApiError("The backend returned an invalid login status.", 502);
  }
  return status;
}

export async function checkSession() {
  const status = await getAuthStatus();
  if (!status.authenticated) throw new ApiError("Please sign in to continue.", 401);
  return true;
}

export async function getCsrf() {
  const status = await getAuthStatus();
  if (!status.authenticated) throw new ApiError("Please sign in to continue.", 401);
  if (!status.csrfToken) throw new ApiError("The backend did not provide a security token.", 502);
  return status.csrfToken;
}

export async function api(path, body) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-TOKEN"] = await getCsrf();
  }
  const response = await send(`/api/v1${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      data.detail || data.message || `Request failed (${response.status}).`,
      response.status,
    );
  return data;
}

export async function signOut() {
  const token = await getCsrf();
  await send("/logout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ _csrf: token }),
  }).catch((error) => {
    if (error.status !== 401) throw error;
  });
}

export async function uploadAudio(url, blob) {
  let response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": blob.type },
      body: blob,
      credentials: "omit",
      signal: AbortSignal.timeout(90000),
    });
  } catch (error) {
    if (error.name === "TimeoutError")
      throw new Error(
        "The audio upload timed out. Your recording is still here; try again.",
      );
    throw new Error(
      "The browser could not upload the recording. Check your connection and that S3 CORS allows this site. Your recording has been kept.",
    );
  }
  if (!response.ok)
    throw new Error(
      `Audio upload failed (${response.status}). Check the S3 bucket's CORS configuration.`,
    );
}
