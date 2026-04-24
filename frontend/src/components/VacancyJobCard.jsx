import { Link } from "react-router-dom";
import { formatVacancySalary, jobTypeLabel, salaryIsSpecified, workTypeLabel } from "../utils/vacancyLabels";

const CARD_PASTELS = [
  "var(--vac-card-0)",
  "var(--vac-card-1)",
  "var(--vac-card-2)",
  "var(--vac-card-3)",
  "var(--vac-card-4)",
  "var(--vac-card-5)",
];

function textSnippet(raw, maxLen = 96) {
  if (!raw) return "";
  const t = String(raw)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length <= maxLen ? t : `${t.slice(0, maxLen)}…`;
}

function IconStar({ filled }) {
  if (filled) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="m12 17.27 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.69-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0l-1.89 4.46-4.83.41c-.88.06-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08L12 17.27Z"
        />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        d="m12 17.27 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.69-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0l-1.89 4.46-4.83.41c-.88.06-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08L12 17.27Z"
      />
    </svg>
  );
}

export default function VacancyJobCard({ vacancy, index, isSaved, onBookmarkClick, detailLinkState }) {
  const pastel = CARD_PASTELS[index % CARD_PASTELS.length];
  const jt = jobTypeLabel(vacancy.job_type);
  const expTag = vacancy.experience_label || null;

  return (
    <article className="vacancies-job-card" style={{ background: pastel }}>
      <div className="vacancies-job-card__top">
        <span className="vacancies-job-card__top-spacer" aria-hidden />
        <button
          type="button"
          className={`vacancies-job-card__bookmark ${isSaved ? "is-saved" : ""}`}
          onClick={onBookmarkClick}
          aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
          title={isSaved ? "In watchlist" : "Watchlist"}
        >
          <IconStar filled={isSaved} />
        </button>
      </div>
      <h3 className="vacancies-job-card__title">{vacancy.title}</h3>
      <p className="vacancies-job-card__company">{vacancy.company || "—"}</p>
      <p className="vacancies-job-card__desc">{textSnippet(vacancy.description)}</p>
      <div className="vacancies-job-card__tags">
        {jt ? <span className="vacancies-pill">{jt}</span> : null}
        {expTag ? <span className="vacancies-pill">{expTag}</span> : null}
        {workTypeLabel(vacancy.work_type) ? (
          <span className="vacancies-pill vacancies-pill--muted">{workTypeLabel(vacancy.work_type)}</span>
        ) : null}
        <span
          className={`vacancies-pill vacancies-pill--salary${salaryIsSpecified(vacancy) ? "" : " vacancies-pill--muted"}`}
        >
          {formatVacancySalary(vacancy)}
        </span>
      </div>
      <div className="vacancies-job-card__actions">
        <Link to={`/vacancies/${vacancy.id}`} state={detailLinkState} className="btn vacancies-btn-outline">
          Details
        </Link>
        {vacancy.url ? (
          <a
            href={vacancy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary vacancies-btn-apply"
          >
            Apply now
          </a>
        ) : (
          <Link to={`/vacancies/${vacancy.id}`} state={detailLinkState} className="btn btn--primary vacancies-btn-apply">
            Apply now
          </Link>
        )}
      </div>
    </article>
  );
}
