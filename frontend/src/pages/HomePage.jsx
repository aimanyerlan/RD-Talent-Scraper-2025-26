import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchVacancies, fetchStats, fetchTopSkills, fetchAllSkills } from "../services/api";
import { formatVacancySalary, salaryIsSpecified } from "../utils/vacancyLabels";

export default function HomePage() {
  const [stats, setStats] = useState({
    total_vacancies: 0,
    total_skills: 0,
    total_companies: 0,
    total_locations: 0,
  });

  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [statsData, skillsData, allSkillsData, vacanciesData] = await Promise.all([
          fetchStats(),
          fetchTopSkills(8),
          fetchAllSkills(),
          fetchVacancies({ ordering: "-published_at", page_size: 12 }),
        ]);

        setStats(statsData);
        setSkills(skillsData || []);
        setAllSkills(allSkillsData || []);

        const jobs = Array.isArray(vacanciesData) ? vacanciesData : (vacanciesData.results || []);
        setFeaturedJobs(jobs.slice(0, 12));
      } catch (error) {
        console.error("Failed to load homepage data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="container home-page">
      <div className="home-panel home-panel--unified">
        <section className="hero">
          <h1 className="hero__title">Find R&D jobs that match your skills</h1>
          <p className="hero__subtitle">
            Discover research and development opportunities from top companies.
            Search, filter, and track the most in-demand skills in one place.
          </p>
          <Link to="/vacancies" className="btn btn--primary" style={{ marginTop: "var(--spacing-lg)" }}>
            Browse All Jobs
          </Link>
        </section>

        <div className="stats-grid home-panel__stats">
          <div className="stat-card">
            <p className="stat-card__value">{stats.total_vacancies || 0}</p>
            <p className="stat-card__label">Live Jobs</p>
          </div>
          <div className="stat-card">
            <p className="stat-card__value">{stats.total_companies || 0}</p>
            <p className="stat-card__label">Companies</p>
          </div>
          <div className="stat-card">
            <p className="stat-card__value">{stats.total_skills || 0}</p>
            <p className="stat-card__label">Skills</p>
          </div>
          <div className="stat-card">
            <p className="stat-card__value">{stats.total_locations || 0}</p>
            <p className="stat-card__label">Locations</p>
          </div>
        </div>

        <section className="home-unified__section home-unified__section--skills">
          <div className="home-panel__header-row">
            <h2 className="home-panel__heading home-panel__heading--skills">
              Most requested skills in R&amp;D vacancies
            </h2>
            <button
              type="button"
              onClick={() => setShowAllSkills(true)}
              className="home-panel__link home-panel__link--large"
            >
              View all skills →
            </button>
          </div>
          {loading ? (
            <div className="loading-state">Loading skills...</div>
          ) : skills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📊</div>
              <h3 className="empty-state__title">No skills data available</h3>
            </div>
          ) : (
            <div className="skills-grid skills-grid--home-right">
              {skills.map((item, index) => (
                <Link
                  key={`${item.skill}-${index}`}
                  to={`/vacancies?skill=${encodeURIComponent(item.skill)}`}
                  className="skill-card skill-card--text-only"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    cursor: "pointer",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <div className="skill-card__info">
                    <h3 className="skill-card__name">{item.skill}</h3>
                    <p className="skill-card__count">
                      {item.vacancy_count} {item.vacancy_count === 1 ? "vacancy" : "vacancies"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="home-unified__section home-unified__section--jobs">
          <div className="home-panel__header-row">
            <h2 className="home-panel__heading home-panel__heading--jobs">Latest opportunities from top companies</h2>
            <Link to="/vacancies" className="home-panel__link home-panel__link--large">
              View all jobs →
            </Link>
          </div>

          {loading ? (
            <div className="loading-state">Loading vacancies...</div>
          ) : featuredJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">💼</div>
              <h3 className="empty-state__title">No vacancies available</h3>
            </div>
          ) : (
            <div className="home-jobs-scroll" tabIndex={0} aria-label="Featured job listings">
              {featuredJobs.map((job) => (
                <article
                  key={job.id}
                  className="job-card home-job-card home-featured-job"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <h3 className="job-card__title home-featured-job__title">{job.title}</h3>
                  <p className="job-card__company home-featured-job__company">{job.company || "Unknown Company"}</p>
                  <div className="job-card__meta home-featured-job__meta">
                    <span className="job-card__location">📍 {job.location || "Remote"}</span>
                    <span
                      className={`job-card__salary home-featured-job__salary${salaryIsSpecified(job) ? "" : " job-card__salary--unspecified"}`}
                    >
                      {formatVacancySalary(job)}
                    </span>
                  </div>

                  <div className="home-featured-job__divider" aria-hidden />

                  <div className="job-card__footer home-featured-job__footer">
                    <span className="job-card__date">{new Date(job.published_at).toLocaleDateString()}</span>
                    <Link to={`/vacancies/${job.id}`} className="btn btn--primary">
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {showAllSkills && (
        <div
          className="modal-overlay"
          onClick={() => setShowAllSkills(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "1000px",
              width: "90%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0 }}>All Skills</h2>
              <button
                type="button"
                onClick={() => setShowAllSkills(false)}
                style={{ fontSize: "24px", border: "none", background: "none", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
                {allSkills.map((item, index) => (
                  <Link
                    key={`${item.skill}-${index}`}
                    to={`/vacancies?skill=${encodeURIComponent(item.skill)}`}
                    className="skill-card skill-card--text-only"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowAllSkills(false)}
                  >
                    <div className="skill-card__info">
                      <h3 className="skill-card__name">{item.skill}</h3>
                      <p className="skill-card__count">
                        {item.vacancy_count} {item.vacancy_count === 1 ? "vacancy" : "vacancies"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
