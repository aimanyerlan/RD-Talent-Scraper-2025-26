import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { addToWatchlist, fetchVacancies, fetchWatchlist, removeFromWatchlist, fetchAllSkills, fetchLocations } from "../services/api";

function formatSalary(vacancy) {
  if (!vacancy.salary_from && !vacancy.salary_to) {
    return "Salary not specified";
  }

  const from = vacancy.salary_from ? vacancy.salary_from : "";
  const to = vacancy.salary_to ? vacancy.salary_to : "";
  const currency = vacancy.currency ? ` ${vacancy.currency}` : "";

  if (from && to) return `${from} - ${to}${currency}`;
  if (from) return `From ${from}${currency}`;
  return `Up to ${to}${currency}`;
}

function formatSkills(skills) {
  if (!skills || skills.length === 0) return [];

  return skills
    .slice(0, 3)
    .map((skill) => (typeof skill === "string" ? skill : skill.name))
    .filter(Boolean);
}

export default function VacanciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [vacancies, setVacancies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page")) || 1
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedLocations, setSelectedLocations] = useState(
    searchParams.get("location") ? searchParams.get("location").split(',') : []
  );
  const [selectedSkills, setSelectedSkills] = useState(
    searchParams.get("skill") ? searchParams.get("skill").split(',') : []
  );
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [ordering, setOrdering] = useState(
    searchParams.get("ordering") || "-published_at"
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedVacancyIds, setSavedVacancyIds] = useState(new Set());
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  const pageSize = 15;

  const loadVacancies = async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const paginatedParams = {
        ...params,
        page_size: pageSize,
        page: params.page || currentPage,
      };

      const data = await fetchVacancies(paginatedParams);

      setVacancies(data.results || data || []);
      setTotalCount(data.count || (data.results || data || []).length);
    } catch (err) {
      console.error(err);
      setError("Failed to load vacancies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [skillsData, locationsData] = await Promise.all([
          fetchAllSkills(),
          fetchLocations()
        ]);
        setAvailableSkills((skillsData || []).map(s => s.skill));
        setAvailableLocations(locationsData || []);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFiltersData();
  }, []);

  useEffect(() => {
    const initialParams = {};

    if (searchParams.get("search")) initialParams.search = searchParams.get("search");
    if (searchParams.get("location")) {
      const locations = searchParams.get("location").split(',').filter(Boolean);
      setSelectedLocations(locations);
      initialParams.location = locations.join(',');
    }
    if (searchParams.get("skill")) {
      const skills = searchParams.get("skill").split(',').filter(Boolean);
      setSelectedSkills(skills);
      initialParams.skill = skills.join(',');
    }
    if (searchParams.get("source")) initialParams.source = searchParams.get("source");
    
    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam) : 1;
    setCurrentPage(page);
    initialParams.page = page;
    
    if (searchParams.get("ordering")) {
      initialParams.ordering = searchParams.get("ordering");
    } else {
      initialParams.ordering = "-published_at";
    }

    loadVacancies(initialParams);
    loadSavedVacancies();
  }, [searchParams.toString()]);

  const loadSavedVacancies = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const data = await fetchWatchlist();
      const items = data.results || data || [];
      const ids = new Set(items.map(item => item.vacancy.id));
      setSavedVacancyIds(ids);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  };

  const buildParams = () => {
    const params = {};

    if (search.trim()) params.search = search.trim();
    if (selectedLocations.length > 0) params.location = selectedLocations.join(',');
    if (selectedSkills.length > 0) params.skill = selectedSkills.join(',');
    if (source.trim()) params.source = source.trim();
    if (ordering) params.ordering = ordering;

    return params;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const params = buildParams();
    params.page = 1;
    setCurrentPage(1);
    setSearchParams(params);
    loadVacancies(params);
  };

  const handleReset = () => {
    setSearch("");
    setSelectedLocations([]);
    setSelectedSkills([]);
    setSource("");
    setOrdering("-published_at");
    setCurrentPage(1);
    setSearchParams({ ordering: "-published_at", page: 1 });
    loadVacancies({ ordering: "-published_at", page: 1 });
  };

  const handlePageChange = (newPage) => {
    const params = buildParams();
    params.page = newPage;
    setCurrentPage(newPage);
    setSearchParams(params);
    loadVacancies(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToWatchlist = async (vacancyId) => {
    const token = localStorage.getItem("access");

    if (!token) {
      alert("Please sign in first.");
      return;
    }

    try {
      if (savedVacancyIds.has(vacancyId)) {
        // Find the watchlist item id
        const data = await fetchWatchlist();
        const items = data.results || data || [];
        const watchlistItem = items.find(item => item.vacancy.id === vacancyId);
        
        if (watchlistItem) {
          await removeFromWatchlist(watchlistItem.id);
          setSavedVacancyIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(vacancyId);
            return newSet;
          });
          alert("Vacancy removed from watchlist.");
        }
      } else {
        await addToWatchlist(vacancyId);
        setSavedVacancyIds(prev => new Set([...prev, vacancyId]));
        alert("Vacancy added to watchlist.");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to update watchlist.");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container">
      <section className="hero" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="hero__title" style={{ fontSize: '2.5rem' }}>Search R&D Jobs</h1>
        <p className="hero__subtitle">
          Find your next research and development opportunity
        </p>

        <form className="hero__search" onSubmit={handleSubmit} style={{ gridTemplateColumns: '1.2fr 0.8fr 0.8fr auto' }}>
          <input
            type="text"
            placeholder="Job title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location"
            value={selectedLocations.join(', ')}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedLocations(value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
            }}
          />
          <select
            value={ordering}
            onChange={(e) => {
              setOrdering(e.target.value);
              const params = buildParams();
              params.ordering = e.target.value;
              params.page = 1;
              setCurrentPage(1);
              setSearchParams(params);
              loadVacancies(params);
            }}
            style={{
              minHeight: '56px',
              padding: '0 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: '#fff',
              outline: 'none',
              fontSize: '1rem'
            }}
          >
            <option value="-published_at">Most recent</option>
            <option value="published_at">Oldest</option>
          </select>
          <button type="submit" className="btn btn--primary">
            Search
          </button>
        </form>
      </section>

      <div className="vacancies-layout">

        <aside className="vacancies-sidebar">
          <h3 className="vacancies-sidebar__title">Filters</h3>

          <div className="filter-group">
            <label className="filter-group__label">Skills</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
              {availableSkills.map(skill => (
                <label key={skill} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSkills([...selectedSkills, skill]);
                      } else {
                        setSelectedSkills(selectedSkills.filter(s => s !== skill));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>{skill}</span>
                </label>
              ))}
              {availableSkills.length === 0 && (
                <div style={{ padding: '8px', color: '#666', fontSize: '0.9rem' }}>Loading skills...</div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-group__label">Locations</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
              {availableLocations.map(location => (
                <label key={location} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(location)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLocations([...selectedLocations, location]);
                      } else {
                        setSelectedLocations(selectedLocations.filter(l => l !== location));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>{location}</span>
                </label>
              ))}
              {availableLocations.length === 0 && (
                <div style={{ padding: '8px', color: '#666', fontSize: '0.9rem' }}>Loading locations...</div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="source" className="filter-group__label">Source</label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">All sources</option>
              <option value="hh">HH</option>
            </select>
          </div>

          <div className="filter-actions">
            <button 
              type="button" 
              className="btn btn--primary" 
              onClick={handleSubmit}
            >
              Apply Filters
            </button>
            <button 
              type="button" 
              className="btn btn--secondary" 
              onClick={handleReset}
            >
              Clear All
            </button>
          </div>
        </aside>

        <div className="vacancies-content">
          {loading && (
            <div className="loading-state">Loading vacancies...</div>
          )}

          {error && (
            <div className="error-state">{error}</div>
          )}

          {!loading && !error && vacancies.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <h3 className="empty-state__title">No vacancies found</h3>
              <p className="empty-state__message">
                Try adjusting your filters or search criteria
              </p>
            </div>
          )}

          {!loading && !error && vacancies.length > 0 && (
            <>
              <div className="jobs-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {vacancies.map((vacancy) => {
                  const visibleSkills = formatSkills(vacancy.skills);
                  const isSaved = savedVacancyIds.has(vacancy.id);

                  return (
                    <article key={vacancy.id} className="job-card" style={{ maxWidth: 'none', display: 'flex', flexDirection: 'column' }}>
                      <div className="job-card__header" style={{ alignItems: 'center' }}>
                        <div className="job-card__logo">
                          {(vacancy.company || "C").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="job-card__info" style={{ flex: 1 }}>
                          <h3 className="job-card__title">{vacancy.title}</h3>
                          <p className="job-card__company">
                            {vacancy.company || "Unknown Company"}
                          </p>
                        </div>
                      </div>

                      <div className="job-card__meta" style={{ alignItems: 'center' }}>
                        <span className="job-card__location">
                          📍 {vacancy.location || "Remote"}
                        </span>
                      </div>

                      {visibleSkills.length > 0 && (
                        <div className="job-card__tags">
                          {visibleSkills.map((skill) => (
                            <span key={skill} className="job-tag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="job-card__footer" style={{ marginTop: 'auto', alignItems: 'center' }}>
                        <span className="job-card__date">
                          {vacancy.published_at
                            ? new Date(vacancy.published_at).toLocaleDateString()
                            : "N/A"}
                        </span>

                        <div style={{ display: "flex", gap: "12px", alignItems: 'center' }}>
                          <button
                            type="button"
                            className={isSaved ? "btn btn--secondary" : "btn btn--ghost"}
                            onClick={() => handleAddToWatchlist(vacancy.id)}
                          >
                            {isSaved ? "Remove" : "Save"}
                          </button>

                          <Link
                            to={`/vacancies/${vacancy.id}`}
                            className="btn btn--primary"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  marginTop: 'var(--spacing-xl)',
                  padding: 'var(--spacing-lg)',
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)'
                }}>
                  <button
                    className="btn btn--secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    ← Previous
                  </button>
                  
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            className={page === currentPage ? "btn btn--primary" : "btn btn--ghost"}
                            onClick={() => handlePageChange(page)}
                            style={{ minWidth: '44px' }}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} style={{ padding: '0 8px' }}>...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    className="btn btn--secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}