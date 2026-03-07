import { useEffect, useState } from "react";
import { fetchWatchlist, removeFromWatchlist } from "../services/api";
import { Link } from "react-router-dom";

export default function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchWatchlist();
        setItems(data.results || data || []);
      } catch (e) {
        console.error('Watchlist error:', e);
        setError(e.message || "Failed to load watchlist");
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  const handleRemove = async (watchlistItemId, vacancyTitle) => {
    if (!window.confirm(`Remove "${vacancyTitle}" from watchlist?`)) {
      return;
    }

    try {
      await removeFromWatchlist(watchlistItemId);
      setItems(items.filter(item => item.id !== watchlistItemId));
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      alert('Failed to remove vacancy from watchlist');
    }
  };

  return (
    <div className="container">
      <div className="watchlist-header">
        <h1 className="watchlist-title">Saved Jobs</h1>
        <p className="watchlist-subtitle">
          Your saved vacancies are listed here
        </p>
      </div>

      {error && <div className="error-state">{error}</div>}

      {loading && (
        <div className="loading-state">Loading your saved jobs...</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <h3 className="empty-state__title">No saved vacancies</h3>
          <p className="empty-state__message">
            Start adding vacancies to your watchlist to see them here
          </p>
          <Link to="/vacancies" className="btn btn--primary">
            Browse Vacancies
          </Link>
        </div>
      )}
      
      {!loading && !error && items.length > 0 && (
        <div className="jobs-grid">
          {items.map((item) => (
            <article key={item.id} className="job-card">
              <div className="job-card__header">
                <div className="job-card__logo">
                  {(item.vacancy.company || "C").slice(0, 1).toUpperCase()}
                </div>
                <div className="job-card__info">
                  <h3 className="job-card__title">{item.vacancy.title}</h3>
                  <p className="job-card__company">
                    {item.vacancy.company || "Unknown Company"}
                  </p>
                </div>
              </div>

              <div className="job-card__meta">
                <span className="job-card__location">
                  📍 {item.vacancy.location || "Remote"}
                </span>
              </div>

              {item.vacancy.skills && item.vacancy.skills.length > 0 && (
                <div className="job-card__tags">
                  {item.vacancy.skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="job-tag">
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="job-card__footer">
                <Link
                  to={`/vacancies/${item.vacancy.id}`}
                  state={{ fromWatchlist: true }}
                  className="job-card__date"
                  style={{ textDecoration: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  View Details →
                </Link>
                <button
                  onClick={() => handleRemove(item.id, item.vacancy.title)}
                  className="btn btn--secondary"
                  style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}