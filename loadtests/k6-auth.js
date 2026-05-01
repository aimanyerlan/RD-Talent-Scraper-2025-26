/**
 * k6: ашық endpoint-тер + опционалды JWT (K6_LOGIN_EMAIL / K6_LOGIN_PASSWORD).
 * CI: Django runserver + тест пайдаланушысымен auth сценарийі орындалады.
 */
import http from "k6/http";
import { check, sleep } from "k6";

function baseUrl() {
  const raw = (__ENV.BASE_URL || "http://localhost:8000").trim();
  return raw.replace(/\/+$/, "");
}

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

const httpParams = {
  timeout: "60s",
  redirects: 10,
  headers: jsonHeaders,
};

export const options = {
  vus: 2,
  duration: "20s",
  thresholds: {
    http_req_failed: ["rate<0.25"],
    http_req_duration: ["p(95)<8000"],
  },
};

function obtainAccessToken(BASE, email, password) {
  const res = http.post(
    `${BASE}/api/auth/login/`,
    JSON.stringify({ email, password }),
    httpParams,
  );
  if (res.status !== 200) {
    return null;
  }
  try {
    const body = JSON.parse(res.body);
    return body.access || null;
  } catch {
    return null;
  }
}

export function setup() {
  const BASE = baseUrl();
  const probe = http.get(`${BASE}/api/vacancies/`, {
    timeout: "60s",
    redirects: 10,
    headers: { Accept: "application/json" },
  });
  if (probe.status !== 200) {
    const hint = probe.body ? probe.body.substring(0, 400).replace(/\s+/g, " ") : "";
    throw new Error(`BASE_URL="${BASE}" — API жауап бермейді (HTTP ${probe.status}). ${hint}`);
  }

  const email = (__ENV.K6_LOGIN_EMAIL || "").trim();
  const password = (__ENV.K6_LOGIN_PASSWORD || "").trim();
  let accessToken = null;
  if (email && password) {
    accessToken = obtainAccessToken(BASE, email, password);
    if (!accessToken) {
      throw new Error("JWT кіру сәтсіз: K6_LOGIN_EMAIL / K6_LOGIN_PASSWORD тексеріңіз.");
    }
  }

  return { BASE, accessToken };
}

export default function (data) {
  const BASE = data.BASE;
  const token = data.accessToken;

  const r1 = http.get(`${BASE}/api/vacancies/`, httpParams);
  check(r1, { "vacancies status 200": (r) => r.status === 200 });

  const r2 = http.get(`${BASE}/api/vacancies/stats/`, httpParams);
  check(r2, { "stats status 200": (r) => r.status === 200 });

  const r3 = http.get(`${BASE}/api/skills/`, httpParams);
  check(r3, { "skills status 200": (r) => r.status === 200 });

  if (token) {
    const authParams = {
      timeout: "60s",
      redirects: 10,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    const r4 = http.get(`${BASE}/api/auth/me/`, authParams);
    check(r4, { "auth me 200": (r) => r.status === 200 });

    const r5 = http.get(`${BASE}/api/watchlist/`, authParams);
    check(r5, { "watchlist 200": (r) => r.status === 200 });
  }

  sleep(0.3 + Math.random() * 0.4);
}
