/**
 * k6 smoke / жеңіл жүктеме.
 * Django `runserver` — бір поток; көп VU кезінде timeout болуы мүмкін.
 *
 * Docker Mac: кейде `host.docker.internal` арқылы емес, `--network host` + 127.0.0.1 қолайлы:
 *   docker run --rm --network host -v "$PWD:/work" -w /work \
 *     -e BASE_URL=http://127.0.0.1:8000 grafana/k6:latest run loadtests/k6-smoke.js
 *
 * Нақты стресті gunicorn/uvicorn (бірнеше worker) арқылы істеңіз.
 */
import http from "k6/http";
import { check, sleep } from "k6";

function baseUrl() {
  const raw = (__ENV.BASE_URL || "http://localhost:8000").trim();
  return raw.replace(/\/+$/, "");
}

const httpParams = {
  timeout: "60s",
  redirects: 10,
  headers: {
    Accept: "application/json",
  },
};

export const options = {
  vus: 3,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.25"],
    http_req_duration: ["p(95)<5000"],
  },
};

export function setup() {
  const BASE = baseUrl();
  const r = http.get(`${BASE}/api/vacancies/`, httpParams);
  if (r.status !== 200) {
    const hint = r.body ? r.body.substring(0, 400).replace(/\s+/g, " ") : "(empty body)";
    throw new Error(
      `BASE_URL="${BASE}" дұрыс емес немесе API жауап бермейді. HTTP ${r.status}. Басы: ${hint}`,
    );
  }
}

export default function () {
  const BASE = baseUrl();

  const r1 = http.get(`${BASE}/api/vacancies/`, httpParams);
  check(r1, { "vacancies status 200": (r) => r.status === 200 });

  const r2 = http.get(`${BASE}/api/vacancies/stats/`, httpParams);
  check(r2, { "stats status 200": (r) => r.status === 200 });

  const r3 = http.get(`${BASE}/api/skills/`, httpParams);
  check(r3, { "skills status 200": (r) => r.status === 200 });

  sleep(0.5 + Math.random() * 0.5);
}
