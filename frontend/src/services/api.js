const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:8000/api";
const USE_COOKIE_AUTH = import.meta.env.VITE_USE_COOKIE_AUTH === "true";

function clearLocalAuthTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

function extractApiError(data, fallback) {
  if (!data || typeof data !== "object") {
    return fallback;
  }
  if (typeof data.detail === "string") {
    return data.detail;
  }
  const firstError = Object.values(data)[0];
  if (Array.isArray(firstError) && firstError.length > 0) {
    return firstError[0];
  }
  if (typeof firstError === "string") {
    return firstError;
  }
  return fallback;
}

function getAuthHeaders() {
  if (USE_COOKIE_AUTH) {
    return {};
  }
  const token = localStorage.getItem("access");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function getCsrfTokenFromCookie() {
  const csrfCookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith("csrftoken="));
  return csrfCookie ? decodeURIComponent(csrfCookie.split("=")[1]) : "";
}

async function ensureCsrfCookie() {
  if (!USE_COOKIE_AUTH) {
    return;
  }
  await fetch(`${API_BASE_URL}/auth/csrf/`, {
    method: "GET",
    credentials: "include",
  });
}

function withAuthFetchOptions(options = {}, { needsCsrf = false } = {}) {
  const next = {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };
  if (USE_COOKIE_AUTH) {
    next.credentials = "include";
    if (needsCsrf) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        next.headers["X-CSRFToken"] = csrfToken;
      }
    }
  }
  return next;
}

export async function loginUser(credentials) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/auth/login/`,
    withAuthFetchOptions(
      {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
      },
      { needsCsrf: true },
    ),
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractApiError(data, "Login failed"));
  }

  return data;
}

export async function googleLogin(credential) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/auth/google/`,
    withAuthFetchOptions(
      {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
      },
      { needsCsrf: true },
    ),
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractApiError(data, "Google login failed"));
  }
  return data;
}

export async function registerUser(formData) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/auth/register/`,
    withAuthFetchOptions(
      {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
      },
      { needsCsrf: true },
    ),
  );
  
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractApiError(data, "Registration failed"));
  }

  return data;
}

export async function verifyEmail(uid, token) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/auth/verify-email/`,
    withAuthFetchOptions(
      {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token }),
      },
      { needsCsrf: true },
    ),
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Email verification failed"));
  return data;
}

export async function requestPasswordReset(email) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/auth/password-reset/`,
    withAuthFetchOptions(
      {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
      },
      { needsCsrf: true },
    ),
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Password reset request failed"));
  return data;
}

export async function resetPassword({ uid, token, new_password, password_confirm }) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/auth/password-reset-confirm/`,
    withAuthFetchOptions(
      {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token, new_password, password_confirm }),
      },
      { needsCsrf: true },
    ),
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Password reset failed"));
  return data;
}

export async function changePassword(old_password, new_password, password_confirm) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/auth/change-password/`,
    withAuthFetchOptions(
      {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ old_password, new_password, password_confirm }),
      },
      { needsCsrf: true },
    ),
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Password change failed"));
  return data;
}

export async function fetchMe() {
  const response = await fetch(
    `${API_BASE_URL}/auth/me/`,
    withAuthFetchOptions({
    headers: {
      ...getAuthHeaders(),
    },
    }),
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearLocalAuthTokens();
      window.dispatchEvent(new Event("auth-changed"));
    }
    throw new Error(data.detail || "Failed to fetch user");
  }

  return data;
}

export async function updateMe(payload) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/auth/me/`,
    withAuthFetchOptions(
      {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
      },
      { needsCsrf: true },
    ),
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Failed to update profile"));
  return data;
}

export async function logoutUser() {
  if (USE_COOKIE_AUTH) {
    await ensureCsrfCookie();
    await fetch(
      `${API_BASE_URL}/auth/logout/`,
      withAuthFetchOptions(
        {
          method: "POST",
        },
        { needsCsrf: true },
      ),
    );
  }
  clearLocalAuthTokens();
}


export async function fetchVacancies(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/vacancies/${query ? `?${query}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch vacancies");
  return response.json();
}

export async function fetchVacancyFacets() {
  const response = await fetch(`${API_BASE_URL}/vacancies/facet-counts/`);
  if (!response.ok) throw new Error("Failed to fetch facet counts");
  return response.json();
}

export async function fetchVacancyById(id) {
  const response = await fetch(`${API_BASE_URL}/vacancies/${id}/`);
  if (!response.ok) throw new Error("Failed to fetch vacancy details");
  return response.json();
}

export async function fetchStats() {
  const response = await fetch(`${API_BASE_URL}/vacancies/stats/`);
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

export async function fetchTopSkills(limit = 8) {
  const response = await fetch(`${API_BASE_URL}/vacancies/top-skills/?limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch top skills");
  return response.json();
}

export async function fetchAllSkills() {
  const response = await fetch(`${API_BASE_URL}/vacancies/top-skills/?limit=100`);
  if (!response.ok) throw new Error("Failed to fetch skills");
  return response.json();
}

export async function fetchLocations() {
  const response = await fetch(`${API_BASE_URL}/vacancies/`);
  if (!response.ok) throw new Error("Failed to fetch locations");
  const data = await response.json();
  const locations = new Set();
  (data.results || data || []).forEach((v) => { if (v.location) locations.add(v.location); });
  return Array.from(locations).sort();
}

export async function fetchWatchlist() {
  const response = await fetch(
    `${API_BASE_URL}/watchlist/`,
    withAuthFetchOptions({
      headers: { ...getAuthHeaders() },
    }),
  );
  if (!response.ok) throw new Error("Failed to fetch watchlist");
  return response.json();
}

export async function addToWatchlist(vacancyId) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/watchlist/`,
    withAuthFetchOptions(
      {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ vacancy_id: vacancyId }),
      },
      { needsCsrf: true },
    ),
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to add to watchlist");
  return data;
}

export async function removeFromWatchlist(id) {
  await ensureCsrfCookie();
  const response = await fetch(
    `${API_BASE_URL}/watchlist/${id}/`,
    withAuthFetchOptions(
      {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      },
      { needsCsrf: true },
    ),
  );
  if (!response.ok) throw new Error("Failed to remove from watchlist");
  return true;
}