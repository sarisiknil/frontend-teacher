const API_BASE = import.meta.env.VITE_API_BASE_URL;

type TokenProvider = () => string | null;

let getToken: TokenProvider = () => null;
let onUnauthorized: (() => void) | null = null;
let refreshSession: (() => Promise<boolean>) | null = null;

export function configureApiAuth(opts: {
  getAccessToken: TokenProvider;
  onUnauthorized?: () => void;
  refreshSession?: () => Promise<boolean>;
}) {
  getToken = opts.getAccessToken;
  onUnauthorized = opts.onUnauthorized ?? null;
  refreshSession = opts.refreshSession ?? null;
}

function json(body: object): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

type ApiError = {
  status: number;
  message: string;
  detail?: any;
};

function parseError(status: number, body: any): ApiError {
  return {
    status,
    message: body?.detail || body?.message || "Request failed",
    detail: body,
  };
}

// --------------------
//  CORE FETCH WRAPPER
// --------------------
export async function apiFetch<T>(
  url: string,
  init: RequestInit = {},
  opts: { requireAuth?: boolean } = {}
): Promise<T> {
  let retry = 0;
  const maxRetries = 1;

  const doRequest = async (): Promise<Response> => {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");

    if (opts.requireAuth) {
      const token = getToken();
      if (!token) throw { status: 401, message: "Not authenticated" };
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, { ...init, headers });
  };

  let response: Response;

  try {
    response = await doRequest();
  } catch (networkError) {
    throw {
      status: 0,
      message: "Network error: cannot reach server",
      detail: networkError,
    } as ApiError;
  }

  // 401 -> try refresh
  if (response.status === 401 && opts.requireAuth && retry < maxRetries) {
    if (refreshSession) {
      const refreshed = await refreshSession();
      if (refreshed) {
        retry++;
        response = await doRequest();
      } else {
        onUnauthorized?.();
        throw { status: 401, message: "Unauthorized" } as ApiError;
      }
    }
  }

  // Not OK -> throw structured error
  if (!response.ok) {
    let body: any = null;

    try {
      body = await response.json();
    } catch {
      /* ignore */
    }

    throw parseError(response.status, body);
  }

  return response.json();
}

export type LoginResponse = {
  message: string;
  mock: string;
};

export type RegisterResponse = {
  message: string;
  mock: string;
};

export const loginRequest = (
  phone_number: string,
  user_type: "TEACHER",
  password: string
): Promise<LoginResponse> =>
  apiPost<LoginResponse>("/api/authenticate/login", {
    phone_number,
    user_type,
    password,
  });

export const registerRequest = (
  phone_number: string,
  user_type: "TEACHER",
  email: string,
  password: string
): Promise<RegisterResponse> =>
  apiPost<RegisterResponse>("/api/authenticate/register", {
    phone_number,
    user_type,
    email,
    password,
  });

export interface AuthenticateResponse {
  access_token: string;
  refresh_token: string;
  expiration: number;
}
export const authenticateRequest = (
  phone_number: string,
  user_type: "TEACHER",
  login_token: string
): Promise<AuthenticateResponse> =>
  apiPost("/api/authenticate/authenticate", {
    phone_number,
    user_type,
    login_token,
    device_token: "web-client",
    user_agent: navigator.userAgent,
    IP_address: "127.0.0.1",
  });

// Refresh
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expiration: number;
}
export const refreshRequest = (
  old_access_token: string,
  refresh_token: string
): Promise<RefreshResponse> =>
  apiPost("/api/authenticate/refresh", {
    old_access_token,
    refresh_token,
    device_token: "web-client",
    user_agent: navigator.userAgent,
    IP_address: "127.0.0.1",
  });

// Password change flow
export interface ChangeVerifyResponse {
  status: string;  // or whatever backend returns
}
export const changeRequest = (
  phone_number: string,
  user_type: "TEACHER",
  purpose: "password"
): Promise<ChangeVerifyResponse> =>
  apiPost("/api/authenticate/change/request", {
    phone_number,
    user_type,
    purpose,
  });

export const changeVerifyRequest = (
  phone_number: string,
  user_type: "TEACHER",
  login_token: string
): Promise<ChangeVerifyResponse> =>
  apiPost("/api/authenticate/change/verify", {
    phone_number,
    user_type,
    login_token,
    purpose: "password",
  });

export const changePassword = (
  phone_number: string,
  user_type: "TEACHER",
  change_token: string,
  new_password: string
): Promise<ChangeVerifyResponse> =>
  apiPost("/api/authenticate/password/change", {
    phone_number,
    user_type,
    change_token,
    new_password,
  });

export const logoutRequest = (
  old_access_token: string,
  refresh_token: string
) =>
  apiPost("/api/authenticate/logout", {
    old_access_token,
    refresh_token,
  });

// --------------------
//  WRAPPER
// --------------------
export function apiPost<T>(
  path: string,
  body: object,
  opts: { requireAuth?: boolean } = {}
): Promise<T> {
  return apiFetch<T>(`${API_BASE}${path}`, json(body), opts);
}
export interface LookupResponse {
  user_id: string;
}
export const userLookup = (
  identifier: string,
  user_type: "TEACHER"
): Promise<LookupResponse> => {
  return apiPost("/api/authenticate/user/lookup", {
    identifier,
    user_type,
  });
};

export interface UserInfoResponse {
  user_id: string;
  phone_number: string;
  email: string;
  user_type: "TEACHER" ;
}

export function getUserInfo(
  user_id: string
): Promise<UserInfoResponse> {
  return apiFetch<UserInfoResponse>(
    `${API_BASE}/api/authenticate/user/${user_id}`,
    {
      method: "GET",
    },
    { requireAuth: true }
  );
}
export function apiGet<T>(
  path: string,
  params: Record<string, string | number> = {},
  opts: { requireAuth?: boolean } = {}
): Promise<T> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE}${path}${query ? `?${query}` : ""}`;

  return apiFetch<T>(
    url,
    { method: "GET" },
    opts
  );
}


export function apiPatch<T>(
  path: string,
  body: object,
  opts: { requireAuth?: boolean } = {}
): Promise<T> {
  return apiFetch<T>(
    `${API_BASE}${path}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    opts
  );
}
export function apiPatchForm<T>(
  path: string,
  form: FormData,
  opts: { requireAuth?: boolean } = {}
): Promise<T> {
  return apiFetch<T>(
    `${API_BASE}${path}`,
    {
      method: "PATCH",
      body: form, // let browser set boundary / headers
    },
    opts
  );
}
