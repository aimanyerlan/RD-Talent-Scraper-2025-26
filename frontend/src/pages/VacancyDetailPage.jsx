import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { addToWatchlist, fetchVacancyById } from "../services/api";

function formatSalary(vacancy) {
  if (!vacancy.salary_from && !vacancy.salary_to) {
    return "Not specified";
  }

  const from = vacancy.salary_from ? vacancy.salary_from : "";
  const to = vacancy.salary_to ? vacancy.salary_to : "";
  const currency = vacancy.currency ? ` ${vacancy.currency}` : "";

  if (from && to) {
    return `${from} - ${to}${currency}`;
  }

  if (from) {
    return `From ${from}${currency}`;
  }

  return `Up to ${to}${currency}`;
}

function formatDate(value) {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
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

      const detail =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to save vacancy to watchlist.";

      setWatchlistError(
        Array.isArray(detail) ? detail.join(", ") : String(detail)
      );
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">Loading vacancy details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <h3 className="empty-state__title">Vacancy not found</h3>
          <p className="empty-state__message">This vacancy may have been removed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link 
        to={fromWatchlist ? "/watchlist" : "/vacancies"} 
        className="section__link" 
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
          fontSize: '1.5rem',
          fontWeight: '600',
          textDecoration: 'none'
        }}
      >
        ←
      </Link>

      <div className="vacancy-detail">
        {/* Header Section with Title and Company */}
        <div className="vacancy-detail__header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '700',
              color: 'white',
              flexShrink: 0
            }}>
              {(vacancy.company || "C").slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="vacancy-detail__title" style={{ marginBottom: 'var(--spacing-sm)' }}>
                {vacancy.title}
              </h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                {vacancy.company || "Unknown Company"}
              </p>
              
              {/* Salary Badge */}
              {(vacancy.salary_from || vacancy.salary_to) && (
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  💰 {formatSalary(vacancy)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meta Information Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-2xl)',
          padding: 'var(--spacing-xl)',
          background: '#f8fafc',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>📍 Location</span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text)' }}>
              {vacancy.location || "Remote / Not specified"}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>📅 Published</span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text)' }}>
              {vacancy.published_at ? new Date(vacancy.published_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : "Not specified"}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>🌐 Source</span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text)', textTransform: 'uppercase' }}>
              {vacancy.source || "N/A"}
            </span>
          </div>
        </div>

        {/* Skills Section */}
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            marginBottom: 'var(--spacing-md)',
            color: 'var(--text)'
          }}>
            Required Skills
          </h3>
          {(!vacancy.skills || vacancy.skills.length === 0) ? (
            <div style={{
              padding: 'var(--spacing-lg)',
              background: '#f8fafc',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              No skills specified for this vacancy
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 'var(--spacing-sm)' 
            }}>
              {vacancy.skills.map((skill, idx) => (
                <span key={idx} style={{
                  padding: '10px 18px',
                  background: 'white',
                  border: '2px solid var(--primary)',
                  color: 'var(--primary)',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}>
                  {typeof skill === "string" ? skill : (skill.name || skill.skill || JSON.stringify(skill))}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description Section */}
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            marginBottom: 'var(--spacing-md)',
            color: 'var(--text)'
          }}>
            Job Description
          </h3>
          <div 
            className="vacancy-description-content"
            style={{ 
              padding: 'var(--spacing-xl)',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              lineHeight: '1.8',
              fontSize: '1rem',
              color: 'var(--text)',
              overflow: 'visible !important',
              whiteSpace: 'normal !important',
              textOverflow: 'clip !important',
              display: 'block !important',
              WebkitLineClamp: 'unset !important',
              WebkitBoxOrient: 'unset !important'
            }}
            dangerouslySetInnerHTML={{ 
              __html: vacancy.description || "No description provided." 
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-md)', 
          flexWrap: 'wrap',
          paddingTop: 'var(--spacing-xl)',
          borderTop: '2px solid var(--border)'
        }}>
          {!fromWatchlist && (
            <button 
              className="btn btn--primary" 
              onClick={handleSaveToWatchlist} 
              disabled={watchlistLoading}
              style={{ 
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {watchlistLoading ? "Saving..." : "💾 Add to Watchlist"}
            </button>
          )}

          {vacancy.url && (
            <a 
              href={vacancy.url} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn--secondary"
              style={{ 
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              🔗 View on {vacancy.source?.toUpperCase() || 'Original Site'}
            </a>
          )}
        </div>

        {/* Messages */}
        {watchlistMessage && (
          <div style={{ 
            padding: 'var(--spacing-lg)', 
            background: '#ecfdf5', 
            border: '2px solid #6ee7b7', 
            borderRadius: 'var(--radius-lg)', 
            color: '#065f46', 
            marginTop: 'var(--spacing-lg)',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            ✓ {watchlistMessage}
          </div>
        )}
        {watchlistError && (
          <div style={{ 
            padding: 'var(--spacing-lg)', 
            background: '#fef2f2', 
            border: '2px solid #fca5a5', 
            borderRadius: 'var(--radius-lg)', 
            color: '#991b1b', 
            marginTop: 'var(--spacing-lg)',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            ✕ {watchlistError}
          </div>
        )}
      </div>
    </div>
  );
}