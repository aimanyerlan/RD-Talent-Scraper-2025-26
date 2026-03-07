import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchVacancies, fetchStats, fetchTopSkills } from "../services/api";

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
          fetchTopSkills(100),
          fetchVacancies({ ordering: "-published_at" }),
        ]);

        setStats(statsData);
        setSkills(skillsData || []);
        setAllSkills(allSkillsData || []);
        setFeaturedJobs((vacanciesData.results || vacanciesData || []).slice(0, 6));
      } catch (error) {
        console.error("Failed to load homepage data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero__title">Find R&D jobs that match your skills</h1>
        <p className="hero__subtitle">
          Discover research and development opportunities from top companies. 
          Search, filter, and track the most in-demand skills in one place.
        </p>
        <Link to="/vacancies" className="btn btn--primary" style={{ marginTop: 'var(--spacing-lg)' }}>
          Browse All Jobs
        </Link>
      </section>

      {/* Stats Cards */}
      <div className="stats-grid">
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

      {/* Popular Skills Section */}
      <section className="section">
        <div className="section__header">
          <div>
            <h2 className="section__title">Popular Skills</h2>
            <p className="section__subtitle">Most requested skills in R&D vacancies</p>
          </div>
          <button 
            onClick={() => setShowAllSkills(true)} 
            className="section__link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
            <p className="empty-state__message">Check back later for skill analytics</p>
          </div>
        ) : (
          <div className="skills-grid">
            {skills.map((item, index) => (
              <div key={`${item.skill}-${index}`} className="skill-card">
                <div className="skill-card__icon">
                  {item.skill?.slice(0, 1).toUpperCase() || "S"}
                </div>
                <div className="skill-card__info">
                  <h3 className="skill-card__name">{item.skill}</h3>
                  <p className="skill-card__count">
                    {item.vacancy_count} {item.vacancy_count === 1 ? 'vacancy' : 'vacancies'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Jobs Section */}
      <section className="section">
        <div className="section__header">
          <div>
            <h2 className="section__title">Featured Jobs</h2>
            <p className="section__subtitle">Latest opportunities from top companies</p>
          </div>
          <Link to="/vacancies" className="section__link">
            View all jobs →
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">Loading vacancies...</div>
        ) : featuredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">💼</div>
            <h3 className="empty-state__title">No vacancies available</h3>
            <p className="empty-state__message">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {featuredJobs.map((job) => (
              <article key={job.id} className="job-card">
                <div className="job-card__header">
                  <div className="job-card__logo">
                    {(job.company || "C").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="job-card__info">
                    <h3 className="job-card__title">{job.title}</h3>
                    <p className="job-card__company">{job.company || "Unknown Company"}</p>
                  </div>
                </div>

                <div className="job-card__meta">
                  <span className="job-card__location">
                    📍 {job.location || "Remote"}
                  </span>
                  {job.salary_from || job.salary_to ? (
                    <span className="job-card__salary">
                      {job.salary_from && job.salary_to 
                        ? `${job.salary_from} - ${job.salary_to}` 
                        : job.salary_from 
                        ? `From ${job.salary_from}` 
                        : `Up to ${job.salary_to}`}
                      {job.currency ? ` ${job.currency}` : ''}
                    </span>
                  ) : null}
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="job-card__tags">
                    {job.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="job-tag">
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="job-card__footer">
                  <span className="job-card__date">
                    {new Date(job.published_at).toLocaleDateString()}
                  </span>
                  <Link to={`/vacancies/${job.id}`} className="btn btn--primary">
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* All Skills Modal */}
      {showAllSkills && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowAllSkills(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '1000px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: 'var(--spacing-2xl)',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 'var(--spacing-xl)',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              paddingBottom: 'var(--spacing-md)',
              borderBottom: '2px solid var(--border)',
              zIndex: 1
            }}>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>All Skills</h2>
              <button 
                onClick={() => setShowAllSkills(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  color: '#666',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  fontWeight: '700',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
              >
                ×
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-md)'
            }}>
              {allSkills.map((item, index) => (
                <div key={`${item.skill}-${index}`} className="skill-card">
                  <div className="skill-card__icon">
                    {item.skill?.slice(0, 1).toUpperCase() || "S"}
                  </div>
                  <div className="skill-card__info">
                    <h3 className="skill-card__name">{item.skill}</h3>
                    <p className="skill-card__count">
                      {item.vacancy_count} {item.vacancy_count === 1 ? 'vacancy' : 'vacancies'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}