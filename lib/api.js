import { TERMS_REQUIRED } from "@/lib/terms";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

const TOKEN_KEY = "zamline_token";
const REFRESH_KEY = "zamline_refresh_token";
const EMAIL_KEY = "zamline_pending_email";
const COMPANY_KEY = "zamline_company_id";
const ROLE_KEY = "zamline_role";
const VERIFIED_KEY = "zamline_verified";

function store(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {}
}

function read(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function endServerSession(token) {
  if (!token || !API_URL || typeof fetch !== "function") return;
  fetch(`${API_URL.replace(/\/+$/, "")}/users/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => {});
}

let sessionVersion = 0;
let refreshing = null;

function startNewSession() {
  sessionVersion += 1;
  refreshing = null;
}

function setToken(token) {
  startNewSession();
  if (token === null) {
    endServerSession(read(TOKEN_KEY));
    store(REFRESH_KEY, null);
  }
  store(TOKEN_KEY, token);
}

function saveTokens({ access_token, refresh_token }) {
  store(TOKEN_KEY, access_token ?? null);
  store(REFRESH_KEY, refresh_token ?? null);
}

export const session = {
  getToken: () => read(TOKEN_KEY),
  setToken,
  getRefreshToken: () => read(REFRESH_KEY),
  setTokens: (tokens) => {
    startNewSession();
    saveTokens(tokens);
  },
  getEmail: () => read(EMAIL_KEY),
  setEmail: (email) => store(EMAIL_KEY, email),
  getCompanyId: () => read(COMPANY_KEY),
  setCompanyId: (id) => store(COMPANY_KEY, id),
  getRole: () => read(ROLE_KEY),
  setRole: (role) => store(ROLE_KEY, role),
  getVerified: () => read(VERIFIED_KEY) === "true",
  setVerified: (verified) =>
    store(VERIFIED_KEY, verified === null ? null : String(Boolean(verified))),
};

export class ApiError extends Error {
  constructor(status, message, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function apiUrl(path) {
  if (!API_URL) {
    throw new ApiError(
      0,
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart the app.",
    );
  }

  return `${API_URL.replace(/\/+$/, "")}${path}`;
}

const TOO_MANY_TRIES =
  "Too many attempts. Please wait a few minutes and try again.";

function readableError(detail, status) {
  if (status === 429) return TOO_MANY_TRIES;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const field = Array.isArray(first.loc)
      ? first.loc[first.loc.length - 1]
      : "";
    const message = (first.msg || "Invalid input").replace(
      /^Value error, /,
      "",
    );

    return field && field !== "body"
      ? `${String(field).replace(/_/g, " ")}: ${message}`
      : message;
  }

  return "Something went wrong. Please try again.";
}

const RENEWED = "renewed";
const REJECTED = "rejected";
const UNAVAILABLE = "unavailable";
const SESSION_UNAVAILABLE =
  "We couldn't renew your session right now. Please try again in a moment.";

async function renewTokens() {
  const version = sessionVersion;
  const refreshToken = read(REFRESH_KEY);
  if (!refreshToken) return { outcome: REJECTED };
  const unchanged = () =>
    version === sessionVersion && read(REFRESH_KEY) === refreshToken;
  let response;
  try {
    response = await fetch(apiUrl("/users/refresh"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    return { outcome: UNAVAILABLE, status: 0 };
  }
  if (!unchanged()) return { outcome: REJECTED };
  if (response.status === 401) {
    store(REFRESH_KEY, null);
    return { outcome: REJECTED };
  }
  if (!response.ok) return { outcome: UNAVAILABLE, status: response.status };
  const tokens = await response.json().catch(() => null);
  if (!tokens?.access_token) return { outcome: UNAVAILABLE, status: 0 };
  if (!unchanged()) return { outcome: REJECTED };
  saveTokens(tokens);
  return { outcome: RENEWED };
}

export function refreshSession() {
  if (!refreshing) {
    const pending = renewTokens().finally(() => {
      if (refreshing === pending) refreshing = null;
    });
    refreshing = pending;
  }
  return refreshing;
}

export async function request(path, options = {}) {
  const url = new URL(apiUrl(path));

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = { Accept: "application/json" };
  const token = options.auth ? session.getToken() : null;

  if (token) headers.Authorization = `Bearer ${token}`;

  if (options.body !== undefined && options.form === undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(url, {
      method:
        options.method ??
        (options.body !== undefined || options.form !== undefined
          ? "POST"
          : "GET"),
      headers,
      body:
        options.form !== undefined
          ? options.form
          : options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;

    throw new ApiError(
      0,
      "Cannot reach the server. Check that the backend is running.",
    );
  }

  if (response.status === 401 && options.auth && !options.retried) {
    const current = session.getToken();
    if (current && current !== token) {
      return request(path, { ...options, retried: true });
    }
    if (session.getRefreshToken()) {
      const renewal = await refreshSession();
      if (renewal.outcome === RENEWED) {
        return request(path, { ...options, retried: true });
      }
      if (renewal.outcome === UNAVAILABLE) {
        throw new ApiError(renewal.status, SESSION_UNAVAILABLE);
      }
    }
  }

  if (response.status === 204) return undefined;

  const data = await response.json().catch(() => null);

  if (
    response.status === 403 &&
    data?.detail === TERMS_REQUIRED &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/terms"
  ) {
    const here = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/terms?next=${encodeURIComponent(here)}`);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      readableError(data?.detail, response.status),
      data?.detail ?? null,
    );
  }

  return data;
}

export async function api(path, options = {}) {
  try {
    return await request(path, options);
  } catch (error) {
    if (error instanceof ApiError) throw error;

    throw new ApiError(0, "Something went wrong. Please try again.");
  }
}
