const API_BASE_URL = "http://localhost:8000/api";

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
  const token = localStorage.getItem("access");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractApiError(data, "Login failed"));
  }

  return data;
}

export async function googleLogin(credential) {
  const response = await fetch(`${API_BASE_URL}/auth/google/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractApiError(data, "Google login failed"));
  }
  return data;
}

export async function registerUser(formData) {
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
  
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractApiError(data, "Registration failed"));
  }

  return data;
}

export async function verifyEmail(uid, token) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Email verification failed"));
  return data;
}

export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Password reset request failed"));
  return data;
}

export async function resetPassword({ uid, token, new_password, password_confirm }) {
  const response = await fetch(`${API_BASE_URL}/auth/password-reset-confirm/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token, new_password, password_confirm }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Password reset failed"));
  return data;
}

export async function changePassword(old_password, new_password, password_confirm) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ old_password, new_password, password_confirm }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Password change failed"));
  return data;
}

export async function fetchMe() {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch user");
  }

  return data;
}

export async function updateMe(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractApiError(data, "Failed to update profile"));
  return data;
}

export function logoutUser() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
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
  const response = await fetch(`${API_BASE_URL}/watchlist/`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch watchlist");
  return response.json();
}

export async function addToWatchlist(vacancyId) {
  const response = await fetch(`${API_BASE_URL}/watchlist/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ vacancy_id: vacancyId }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to add to watchlist");
  return data;
}

export async function removeFromWatchlist(id) {
  const response = await fetch(`${API_BASE_URL}/watchlist/${id}/`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to remove from watchlist");
  return true;
}