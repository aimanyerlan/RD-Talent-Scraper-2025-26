import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWatchlist, removeFromWatchlist } from "../services/api";
import VacancyJobCard from "../components/VacancyJobCard";

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
        console.error("Watchlist error:", e);
        setError(e.message || "Failed to load watchlist");
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  const handleRemove = async (watchlistItemId) => {
    try {
      await removeFromWatchlist(watchlistItemId);
      setItems((prev) => prev.filter((item) => item.id !== watchlistItemId));
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
      alert("Failed to remove vacancy from watchlist");
    }
  };

  return (
    <div className="container home-page watchlist-page">
      <section className="home-panel home-panel--watchlist">
        <div className="home-panel__header-row">
          <div>
            <h1 className="watchlist-page__title">Saved jobs</h1>
            <p className="watchlist-page__meta">
              {loading ? "Loading…" : `${items.length} ${items.length === 1 ? "vacancy" : "vacancies"} in your watchlist`}
            </p>
          </div>
          <Link to="/vacancies" className="home-panel__link home-panel__link--large">
            Browse vacancies →
          </Link>
        </div>

        {error ? <div className="error-state watchlist-page__error">{error}</div> : null}

        {loading ? (
          <div className="vacancies-grid vacancies-grid--redesign watchlist-page__grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="vacancies-card-skeleton" />
            ))}
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">⭐</div>
            <h3 className="empty-state__title">No saved vacancies yet</h3>
            <p className="empty-state__message">Save roles from the vacancies page — they will show up here.</p>
            <Link to="/vacancies" className="btn btn--primary">
              Browse vacancies
            </Link>
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="vacancies-grid vacancies-grid--redesign watchlist-page__grid">
            {items.map((item, index) => (
              <VacancyJobCard
                key={item.id}
                vacancy={item.vacancy}
                index={index}
                isSaved
                detailLinkState={{ fromWatchlist: true }}
                onBookmarkClick={() => handleRemove(item.id)}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
