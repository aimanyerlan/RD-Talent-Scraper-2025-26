const WORK_TYPE_LABELS = {
  onsite: "On site",
  remote: "Remote",
  hybrid: "Hybrid",
};

const JOB_TYPE_LABELS = {
  full_time: "Full time",
  part_time: "Part time",
  remote: "Remote",
  internship: "Internship",
  contract: "Contract",
};

export function workTypeLabel(key) {
  if (!key) return null;
  return WORK_TYPE_LABELS[key] || key;
}

export function jobTypeLabel(key) {
  if (!key) return null;
  return JOB_TYPE_LABELS[key] || key;
}

function stripHtmlSnippet(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSalaryFromDescription(raw) {
  const text = stripHtmlSnippet(raw);
  if (text.length < 8) return null;

  const patterns = [
    /\bstarting at\s+\$?[\d,]+(?:\+)?(?:\s*USD)?(?:\s*per\s+(?:hour|hr))?/i,
    /\bfrom\s+\$?[\d,]+(?:\s*(?:to|[-–])\s*\$?[\d,]+)?(?:\s*(?:USD|EUR|KZT|₸))?/i,
    /\$\s*[\d,]+(?:\+)?(?:\s*(?:USD|EUR|KZT|₸))?(?:\s*per\s+(?:hour|hr))?/i,
    /\b(?:USD|EUR)\s*\$?\s*[\d,]+(?:\+)?/i,
    /\d[\d\s,.]{2,14}\s*[–-]\s*\d[\d\s,.]{2,14}\s*(?:USD|EUR|KZT|₸|руб|₽|тг|tenge)/i,
    /\b\d{2,3}(?:\s?\d{3})+\s*(?:₸|KZT|тг|tenge|\$|USD)\b/i,
    /\b(?:up to|до)\s+\$?[\d\s,.]+(?:\s*(?:USD|EUR|KZT|₸))?/i,
  ];

  let best = null;
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const c = m[0].trim();
    if (c.length >= 5 && c.length <= 96 && (!best || c.length > best.length)) {
      best = c;
    }
  }
  return best;
}

export function formatVacancySalary(vacancy) {
  if (!vacancy) return "Not specified";
  const from = vacancy.salary_from;
  const to = vacancy.salary_to;
  const hasFrom = from != null && from !== "";
  const hasTo = to != null && to !== "";
  if (!hasFrom && !hasTo) {
    const hint = extractSalaryFromDescription(vacancy.description);
    if (hint) return hint;
    return "Not specified";
  }
  const currency = vacancy.currency ? ` ${vacancy.currency}` : "";
  if (hasFrom && hasTo) {
    return `${from} – ${to}${currency}`;
  }
  if (hasFrom) {
    return `From ${from}${currency}`;
  }
  return `Up to ${to}${currency}`;
}

export function salaryIsSpecified(vacancy) {
  if (!vacancy) return false;
  const from = vacancy.salary_from;
  const to = vacancy.salary_to;
  if ((from != null && from !== "") || (to != null && to !== "")) return true;
  return Boolean(extractSalaryFromDescription(vacancy.description));
}
