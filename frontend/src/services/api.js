const API_BASE_URL = "http://localhost:8000/api";

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
    throw new Error(data.detail || "Login failed");
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
    if (typeof data === "object" && data !== null) {
      const firstError = Object.values(data)[0];
      if (Array.isArray(firstError)) {
        throw new Error(firstError[0]);
      }
    }
    throw new Error("Registration failed");
  }

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

export function logoutUser() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export async function fetchVacancies(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query
    ? `${API_BASE_URL}/vacancies/?${query}`
    : `${API_BASE_URL}/vacancies/`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch vacancies");
  }

  return response.json();
}

export async function fetchVacancyById(id) {
  const response = await fetch(`${API_BASE_URL}/vacancies/${id}/`);

  if (!response.ok) {
    throw new Error("Failed to fetch vacancy details");
  }

  return response.json();
}

export async function fetchStats() {
  const response = await fetch("http://127.0.0.1:8000/api/vacancies/stats/");
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  return response.json();
}

export async function fetchTopSkills(limit = 8) {
  const response = await fetch(
    `http://127.0.0.1:8000/api/vacancies/top-skills/?limit=${limit}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch top skills");
  }
  return response.json();
}

export async function fetchAllSkills() {
  const response = await fetch("http://127.0.0.1:8000/api/vacancies/top-skills/?limit=100");
  if (!response.ok) {
    throw new Error("Failed to fetch skills");
  }
  return response.json();
}

export async function fetchLocations() {
  const response = await fetch("http://127.0.0.1:8000/api/vacancies/");
  if (!response.ok) {
    throw new Error("Failed to fetch locations");
  }
  const data = await response.json();
  const locations = new Set();
  (data.results || data || []).forEach(vacancy => {
    if (vacancy.location) locations.add(vacancy.location);
  });
  return Array.from(locations).sort();
}

export async function fetchWatchlist() {
  const response = await fetch(`${API_BASE_URL}/watchlist/`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch watchlist");
  }

  return response.json();
}

export async function addToWatchlist(vacancyId) {
  const token = localStorage.getItem("access");

  const response = await fetch(`${API_BASE_URL}/watchlist/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      vacancy_id: vacancyId,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to add to watchlist");
  }

  return data;
}

export async function removeFromWatchlist(id) {
  const response = await fetch(`${API_BASE_URL}/watchlist/${id}/`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to remove from watchlist");
  }

  return true;
}