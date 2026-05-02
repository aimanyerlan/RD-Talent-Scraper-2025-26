import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { addToWatchlist, fetchVacancyById } from "../services/api";
import { formatVacancySalary, jobTypeLabel, salaryIsSpecified, workTypeLabel } from "../utils/vacancyLabels";

function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 6l-7 6 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M4 13h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2" fill="currentColor" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function IconMoney() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v18M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4h12v16l-6-4-6 4V4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 3h7v7M10 14L21 3M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function stripTagsKeepLineBreaks(html) {
  if (!html) return "";
  return html
    .replace(/\r/g, "")
    .replace(/<\/(p|div|h[1-6]|tr|blockquote)>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const SECTION_HEADERS = [
  "What we offer",
  "Key responsibilities",
  "About the role",
  "About the job",
  "Job responsibilities",
  "Key requirements",
  "Qualifications",
  "Responsibilities",
  "Requirements",
  "Benefits",
  "Notes",
  "Your role",
  "Nice to have",
  "Must-haves",
  "Must have",
  "Обязанности",
  "Требования",
  "Условия",
  "Чем предстоит заниматься",
  "Мы ожидаем",
  "Мы предлагаем",
  "О компании",
  "Задачи",
  "Навыки",
].sort((a, b) => b.length - a.length);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
}

function insertSectionBreaks(plain) {
  const inner = SECTION_HEADERS.map(escapeRe).join("|");
  const re = new RegExp(`\\s+(?=(${inner})\\b)`, "gi");
  return plain.replace(re, "\n\n");
}

function splitLongIntoParagraphs(text, softMax = 360) {
  const t = text.trim();
  if (!t) return [];
  if (t.length <= softMax) {
    return [{ type: "p", text: t }];
  }
  const parts = t.split(/\.\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return [{ type: "p", text: t }];
  }
  return parts.map((part, i) => ({
    type: "p",
    text: i < parts.length - 1 && !/[.!?]$/.test(part.trim()) ? `${part.trim()}.` : part.trim(),
  }));
}

function tryClauseBullets(body) {
  const t = body.trim();
  if (t.length < 80) return null;
  const re =
    /(?=\s+(?:You'll|You will|You can|We offer|Projects are|Payments? are|Only applicants|This is an? independent|Give\s|Evaluate\s|Conduct\s|Measure\s)\b)/i;
  if (!re.test(t)) return null;
  const items = t
    .split(re)
    .map((x) => x.trim())
    .filter(Boolean);
  if (items.length < 2) return null;
  return [{ type: "ul", items }];
}

function bodyToBlocks(body) {
  const t = body.trim();
  if (!t) return [];
  const asList = tryClauseBullets(t);
  if (asList) return asList;
  return splitLongIntoParagraphs(t);
}

const HEADER_LINE_RE = new RegExp(
  `^(${SECTION_HEADERS.map(escapeRe).join("|")})\\s*:?\\s*(.*)$`,
  "is",
);

function processLegacyBulletsAndParagraphs(chunk) {
  const lines = chunk.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  let bullets = [];
  const bulletRe = /^(?:[-*•\u2013\u2014]|•\s*|\d+[.)])\s+(.+)$/;
  const flush = () => {
    if (bullets.length) {
      out.push({ type: "ul", items: [...bullets] });
      bullets = [];
    }
  };
  for (const line of lines) {
    const m = line.match(bulletRe);
    if (m) {
      bullets.push(m[1].trim());
    } else {
      flush();
      out.push(...bodyToBlocks(line));
    }
  }
  flush();
  return out.length ? out : bodyToBlocks(chunk);
}

function buildDescriptionBlocks(html) {
  let plain = stripTagsKeepLineBreaks(html);
  if (!plain) {
    return [{ type: "p", text: "No description provided." }];
  }
  plain = insertSectionBreaks(plain);
  const chunks = plain.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  const blocks = [];

  for (const chunk of chunks) {
    const hm = chunk.match(HEADER_LINE_RE);
    if (hm) {
      const title = hm[1].trim();
      const body = (hm[2] || "").trim();
      blocks.push({ type: "h3", text: title });
      if (body) {
        blocks.push(...bodyToBlocks(body));
      }
    } else {
      blocks.push(...processLegacyBulletsAndParagraphs(chunk));
    }
  }

  return blocks.length ? blocks : [{ type: "p", text: plain }];
}

const HIGHLIGHT_KEYWORDS = [
  "responsibil",
  "require",
  "must",
  "need",
  "qualif",
  "experience",
  "skill",
  "offer",
  "benefit",
  "salary",
  "paid",
  "remote",
  "hybrid",
  "onsite",
  "hour",
  "full time",
  "part time",
  "contract",
  "intern",
];

function scoreHighlight(text, sectionTitle = "") {
  const t = text.toLowerCase();
  const section = sectionTitle.toLowerCase();
  let score = 0;
  for (const key of HIGHLIGHT_KEYWORDS) {
    if (t.includes(key)) score += 2;
    if (section.includes(key)) score += 2;
  }
  if (section.includes("responsibil") || section.includes("обязан")) score += 4;
  if (section.includes("require") || section.includes("требован")) score += 4;
  if (section.includes("offer") || section.includes("услов")) score += 3;
  if (/\d/.test(t)) score += 1;
  if (t.length < 35 || t.length > 240) score -= 2;
  return score;
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeForDedup(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

function extractHighlights(blocks, maxItems = 6) {
  let sectionTitle = "";
  const candidates = [];

  for (const block of blocks) {
    if (block.type === "h3") {
      sectionTitle = block.text || "";
      continue;
    }
    if (block.type === "ul" && Array.isArray(block.items)) {
      for (const item of block.items) {
        candidates.push({ text: item, score: scoreHighlight(item, sectionTitle) + 2 });
      }
      continue;
    }
    if (block.type === "p" && block.text) {
      const sentences = splitSentences(block.text);
      const top = sentences.length > 1 ? sentences.slice(0, 2) : sentences;
      for (const sentence of top) {
        candidates.push({ text: sentence, score: scoreHighlight(sentence, sectionTitle) });
      }
    }
  }

  const seen = new Set();
  const deduped = candidates.filter((item) => {
    const key = normalizeForDedup(item.text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const selected = deduped
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((item) => item.text);

  if (selected.length) return selected;

  // Fallback for very noisy descriptions.
  const fallback = [];
  for (const block of blocks) {
    if (block.type === "ul" && block.items?.length) {
      fallback.push(...block.items.slice(0, 3));
    } else if (block.type === "p" && block.text) {
      fallback.push(...splitSentences(block.text).slice(0, 2));
    }
    if (fallback.length >= maxItems) break;
  }
  return fallback.slice(0, maxItems);
}

export default function VacancyDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const fromWatchlist = location.state?.fromWatchlist;

  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistMessage, setWatchlistMessage] = useState("");
  const [watchlistError, setWatchlistError] = useState("");

  useEffect(() => {
    const loadVacancy = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchVacancyById(id);
        setVacancy(data);
      } catch (e) {
        console.error(e);
        setError("Failed to load vacancy details");
      } finally {
        setLoading(false);
      }
    };
    loadVacancy();
  }, [id]);

  const handleSaveToWatchlist = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setWatchlistError("Please log in to save this vacancy.");
      setWatchlistMessage("");
      return;
    }
    try {
      setWatchlistLoading(true);
      setWatchlistError("");
      setWatchlistMessage("");
      await addToWatchlist(vacancy.id);
      setWatchlistMessage("Vacancy saved to watchlist.");
    } catch (e) {
      console.error(e);
      const detail = e?.message || "Failed to save vacancy to watchlist.";
      setWatchlistError(Array.isArray(detail) ? detail.join(", ") : String(detail));
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="vacancy-detail-page">
        <div className="vacancy-detail vacancy-detail--glass vacancy-detail--loading">Loading vacancy details…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vacancy-detail-page">
        <div className="vacancy-detail vacancy-detail--glass vacancy-detail--error">{error}</div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="vacancy-detail-page">
        <div className="vacancy-detail vacancy-detail--glass vacancy-detail__empty">
          <div className="vacancy-detail__empty-icon" aria-hidden>
            <IconSearch />
          </div>
          <h3 className="vacancy-detail__empty-title">Vacancy not found</h3>
          <p className="vacancy-detail__empty-text">This vacancy may have been removed.</p>
          <Link to="/vacancies" className="btn btn--primary vacancy-detail__empty-btn">
            Back to vacancies
          </Link>
        </div>
      </div>
    );
  }

  const descBlocks = buildDescriptionBlocks(vacancy.description);
  const highlights =
    Array.isArray(vacancy.ai_summary) && vacancy.ai_summary.length > 0
      ? vacancy.ai_summary
      : extractHighlights(descBlocks);
  const publishedLabel = vacancy.published_at
    ? new Date(vacancy.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not specified";

  return (
    <div className="vacancy-detail-page">
      <Link
        to={fromWatchlist ? "/watchlist" : "/vacancies"}
        className="vacancy-detail__back"
      >
        <IconChevronLeft />
        <span>{fromWatchlist ? "Back to watchlist" : "Back to vacancies"}</span>
      </Link>

      <article className="vacancy-detail vacancy-detail--glass">
        <header className="vacancy-detail__header">
          <div className="vacancy-detail__title-row">
            <div className="vacancy-detail__brand" aria-hidden>
              <IconBriefcase />
            </div>
            <div className="vacancy-detail__title-block">
              <h1 className="vacancy-detail__title">{vacancy.title}</h1>
              <p className="vacancy-detail__company">{vacancy.company || "Unknown company"}</p>
              <div
                className={`vacancy-detail__salary-pill${salaryIsSpecified(vacancy) ? "" : " vacancy-detail__salary-pill--muted"}`}
              >
                <IconMoney />
                <span>{formatVacancySalary(vacancy)}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="vacancy-detail__meta-grid">
          <div className="vacancy-detail__meta-cell">
            <span className="vacancy-detail__meta-label">
              <IconPin />
              Location
            </span>
            <span className="vacancy-detail__meta-value">{vacancy.location || "Remote / not specified"}</span>
          </div>
          <div className="vacancy-detail__meta-cell">
            <span className="vacancy-detail__meta-label">
              <IconCalendar />
              Published
            </span>
            <span className="vacancy-detail__meta-value">{publishedLabel}</span>
          </div>
          <div className="vacancy-detail__meta-cell">
            <span className="vacancy-detail__meta-label">
              <IconGlobe />
              Source
            </span>
            <span className="vacancy-detail__meta-value vacancy-detail__meta-value--caps">
              {vacancy.source || "—"}
            </span>
          </div>
          {vacancy.experience_label ? (
            <div className="vacancy-detail__meta-cell">
              <span className="vacancy-detail__meta-label">Experience</span>
              <span className="vacancy-detail__meta-value">{vacancy.experience_label}</span>
            </div>
          ) : null}
          {workTypeLabel(vacancy.work_type) ? (
            <div className="vacancy-detail__meta-cell">
              <span className="vacancy-detail__meta-label">Work type</span>
              <span className="vacancy-detail__meta-value">{workTypeLabel(vacancy.work_type)}</span>
            </div>
          ) : null}
          {jobTypeLabel(vacancy.job_type) ? (
            <div className="vacancy-detail__meta-cell">
              <span className="vacancy-detail__meta-label">Job type</span>
              <span className="vacancy-detail__meta-value">{jobTypeLabel(vacancy.job_type)}</span>
            </div>
          ) : null}
        </div>

        <section className="vacancy-detail__section">
          <h2 className="vacancy-detail__section-title">Required skills</h2>
          {!vacancy.skills || vacancy.skills.length === 0 ? (
            <p className="vacancy-detail__skills-empty">No skills specified for this vacancy.</p>
          ) : (
            <ul className="vacancy-detail__skills-list">
              {vacancy.skills.map((skill, idx) => (
                <li key={idx} className="vacancy-detail__skill-pill">
                  {typeof skill === "string" ? skill : skill.name || skill.skill || "—"}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="vacancy-detail__section">
          <h2 className="vacancy-detail__section-title">Key highlights</h2>
          <div className="vacancy-detail__highlights-box">
            <ul className="vacancy-detail__highlights-list">
              {highlights.map((item, idx) => (
                <li key={idx} className="vacancy-detail__highlights-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="vacancy-detail__actions">
          {!fromWatchlist && (
            <button type="button" className="btn btn--primary vacancy-detail__btn" onClick={handleSaveToWatchlist} disabled={watchlistLoading}>
              <IconBookmark />
              {watchlistLoading ? "Saving…" : "Add to watchlist"}
            </button>
          )}
          {vacancy.url ? (
            <a href={vacancy.url} target="_blank" rel="noopener noreferrer" className="btn btn--ghost vacancy-detail__btn vacancy-detail__btn--outline">
              <IconExternal />
              View on {vacancy.source ? String(vacancy.source).toUpperCase() : "source"}
            </a>
          ) : null}
        </footer>

        {watchlistMessage ? (
          <div className="vacancy-detail__alert vacancy-detail__alert--success" role="status">
            <IconCheck />
            <span>{watchlistMessage}</span>
          </div>
        ) : null}
        {watchlistError ? (
          <div className="vacancy-detail__alert vacancy-detail__alert--error" role="alert">
            <IconAlert />
            <span>{watchlistError}</span>
          </div>
        ) : null}
      </article>
    </div>
  );
}
