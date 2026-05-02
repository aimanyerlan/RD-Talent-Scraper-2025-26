import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  addToWatchlist,
  fetchVacancies,
  fetchWatchlist,
  removeFromWatchlist,
  fetchAllSkills,
  fetchVacancyFacets,
} from "../services/api";
import VacancyJobCard from "../components/VacancyJobCard";

const JOB_TYPE_OPTIONS = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },

  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

const WORK_TYPE_OPTIONS = [
  { value: "onsite", label: "On site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

function IconSearch({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function buildPageList(current, total, maxVisible = 7) {
  if (total <= 0) return [];
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const edge = 1;
  const middleSlots = Math.max(1, maxVisible - edge * 2 - 2);
  const half = Math.floor(middleSlots / 2);
  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, start + middleSlots - 1);
  if (end - start + 1 < middleSlots) {
    start = Math.max(2, end - middleSlots + 1);
  }

  const set = new Set([1, total]);
  for (let p = start; p <= end; p += 1) set.add(p);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

function FilterAccordion({ title, open, onToggle, children, rightSlot }) {
  return (
    <div className="vacancies-filter-block">
      <button type="button" className="vacancies-filter-block__head" onClick={onToggle}>
        <span className="vacancies-filter-block__chevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
        <span className="vacancies-filter-block__title">{title}</span>
        {rightSlot}
      </button>
      {open ? <div className="vacancies-filter-block__body">{children}</div> : null}
    </div>
  );
}

export default function VacanciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vacancies, setVacancies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page"), 10) || 1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [experienceBucket, setExperienceBucket] = useState(
    searchParams.get("experience_bucket") || ""
  );
  const [cityInput, setCityInput] = useState(searchParams.get("city") || "");
  const [selectedSkills, setSelectedSkills] = useState(
    searchParams.get("skill") ? searchParams.get("skill").split(",").filter(Boolean) : []
  );
  const [selectedJobTypes, setSelectedJobTypes] = useState(
    searchParams.get("job_type") ? searchParams.get("job_type").split(",").filter(Boolean) : []
  );
  const [selectedWorkTypes, setSelectedWorkTypes] = useState(
    searchParams.get("work_type") ? searchParams.get("work_type").split(",").filter(Boolean) : []
  );
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [ordering, setOrdering] = useState(() => {
    const o = searchParams.get("ordering") || "-published_at";
    return o === "salary_from" || o === "-salary_from" ? "-published_at" : o;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedVacancyIds, setSavedVacancyIds] = useState(new Set());
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [facets, setFacets] = useState({
    job_type: {},
    work_type: {},
    total: 0,
    locations: [],
    experiences: [],
  });
  const [openFilters, setOpenFilters] = useState({ jobType: true, workType: true, skills: true });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const pageSize = 15;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileFiltersOpen(true);
      return;
    }
    setMobileFiltersOpen(false);
    setOpenFilters({ jobType: false, workType: false, skills: false });
  }, [isMobile]);

  const toggleFilter = (key) => {
    setOpenFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadVacancies = async (params = {}) => {
    try {
      setLoading(true);
      setError("");
      const paginatedParams = { ...params, page_size: pageSize };
      const data = await fetchVacancies(paginatedParams);
      setVacancies(data.results || data || []);
      setTotalCount(data.count || 0);
    } catch {
      setError("Failed to load vacancies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, searchParams]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [skillsData, facetData] = await Promise.all([fetchAllSkills(), fetchVacancyFacets()]);
        setSkillsOptions(skillsData || []);
        setFacets({
          job_type: facetData?.job_type || {},
          work_type: facetData?.work_type || {},
          total: facetData?.total ?? 0,
          locations: facetData?.locations || [],
          experiences: facetData?.experiences || [],
        });
      } catch (e) {
        console.error(e);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const rawOrdering = searchParams.get("ordering") || "-published_at";
    const orderingValue =
      rawOrdering === "salary_from" || rawOrdering === "-salary_from"
        ? "-published_at"
        : rawOrdering;

    const initialParams = {
      search: searchParams.get("search") || "",
      city: searchParams.get("city") || "",
      experience_bucket: searchParams.get("experience_bucket") || "",
      skill: searchParams.get("skill") || "",
      job_type: searchParams.get("job_type") || "",
      work_type: searchParams.get("work_type") || "",
      source: searchParams.get("source") || "",
      ordering: orderingValue,
      page: searchParams.get("page") || 1,
    };

    setSearch(initialParams.search);
    setCityInput(initialParams.city);
    setExperienceBucket(initialParams.experience_bucket);
    setSelectedSkills(initialParams.skill ? initialParams.skill.split(",").filter(Boolean) : []);
    setSelectedJobTypes(initialParams.job_type ? initialParams.job_type.split(",").filter(Boolean) : []);
    setSelectedWorkTypes(initialParams.work_type ? initialParams.work_type.split(",").filter(Boolean) : []);
    setOrdering(initialParams.ordering);
    setCurrentPage(parseInt(initialParams.page, 10) || 1);

    const apiParams = {
      page: initialParams.page,
      ordering: initialParams.ordering,
    };
    if (initialParams.search) apiParams.search = initialParams.search;
    if (initialParams.city) apiParams.city = initialParams.city;
    if (initialParams.experience_bucket) apiParams.experience_bucket = initialParams.experience_bucket;
    if (initialParams.skill) apiParams.skill = initialParams.skill;
    if (initialParams.job_type) apiParams.job_type = initialParams.job_type;
    if (initialParams.work_type) apiParams.work_type = initialParams.work_type;
    if (initialParams.source) apiParams.source = initialParams.source;
    setSource(initialParams.source || "");
    loadVacancies(apiParams);
    loadSavedVacancies();
  }, [searchParams]);

  const loadSavedVacancies = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      const data = await fetchWatchlist();
      const items = data.results || data || [];
      const ids = new Set(items.map((item) => item.vacancy.id));
      setSavedVacancyIds(ids);
    } catch (e) {
      console.error(e);
    }
  };

  const buildParams = () => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (cityInput.trim()) params.city = cityInput.trim();
    if (experienceBucket.trim()) params.experience_bucket = experienceBucket.trim();
    if (selectedSkills.length) params.skill = selectedSkills.join(",");
    if (selectedJobTypes.length) params.job_type = selectedJobTypes.join(",");
    if (selectedWorkTypes.length) params.work_type = selectedWorkTypes.join(",");
    if (source) params.source = source;
    params.ordering = ordering;
    return params;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const params = buildParams();
    params.page = 1;
    setSearchParams(params);
  };

  const handleReset = () => {
    setExperienceBucket("");
    setCityInput("");
    setSearchParams({ ordering: "-published_at", page: 1 });
  };

  const handlePageChange = (newPage) => {
    const params = buildParams();
    params.page = newPage;
    setSearchParams(params);
  };

  const handleAddToWatchlist = async (vacancyId) => {
    const token = localStorage.getItem("access");
    if (!token) return alert("Please log in first.");
    try {
      if (savedVacancyIds.has(vacancyId)) {
        const data = await fetchWatchlist();
        const items = data.results || data || [];
        const item = items.find((i) => i.vacancy.id === vacancyId);
        if (item) {
          await removeFromWatchlist(item.id);
          setSavedVacancyIds((prev) => {
            const n = new Set(prev);
            n.delete(vacancyId);
            return n;
          });
        }
      } else {
        await addToWatchlist(vacancyId);
        setSavedVacancyIds((prev) => new Set([...prev, vacancyId]));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleJobType = (value) => {
    setSelectedJobTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleWorkType = (value) => {
    setSelectedWorkTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const headline = search.trim() || "R&D vacancies";
  const pageItems = useMemo(
    () => buildPageList(currentPage, totalPages, isMobile ? 5 : 7),
    [currentPage, totalPages, isMobile]
  );

  return (
    <div className="container vacancies-page">
      <form className="vacancies-search-bar" onSubmit={handleSubmit}>
        <div className="vacancies-search-bar__segment vacancies-search-bar__segment--grow">
          <IconSearch className="vacancies-search-bar__icon-svg" />
          <input
            type="search"
            className="vacancies-search-bar__input"
            placeholder="Role, stack, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
        </div>
        <div className="vacancies-search-bar__divider" />
        <div className="vacancies-search-bar__segment vacancies-search-bar__segment--grow">
          <select
            className="vacancies-search-bar__select"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            aria-label="City"
          >
            <option value="">All cities</option>
            {facets.locations.map((row) => (
              <option key={row.city_key} value={row.city_key}>
                {row.label} ({row.vacancy_count})
              </option>
            ))}
          </select>
        </div>
        <div className="vacancies-search-bar__divider" />
        <div className="vacancies-search-bar__segment vacancies-search-bar__segment--grow">
          <select
            className="vacancies-search-bar__select"
            value={experienceBucket}
            onChange={(e) => setExperienceBucket(e.target.value)}
            aria-label="Experience"
          >
            <option value="">Any experience</option>
            {facets.experiences.map((row) => (
              <option key={row.bucket} value={row.bucket}>
                {row.label} ({row.vacancy_count})
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="vacancies-search-bar__submit btn btn--primary">
          <IconSearch className="vacancies-search-bar__submit-icon-svg" />
          Search
        </button>
      </form>

      <div className="vacancies-layout vacancies-layout--redesign">
        {isMobile ? (
          <button
            type="button"
            className="vacancies-mobile-filters-toggle btn btn--secondary"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
          >
            {mobileFiltersOpen ? "Hide filters" : "Show filters"}
          </button>
        ) : null}
        <aside
          className={`vacancies-sidebar vacancies-sidebar--redesign${
            isMobile && !mobileFiltersOpen ? " is-mobile-hidden" : ""
          }`}
        >
          <div className="vacancies-sidebar__head">
            <h2 className="vacancies-sidebar__title">Filters</h2>
            <button type="button" className="vacancies-sidebar__clear" onClick={handleReset}>
              Clear all
            </button>
          </div>

          <FilterAccordion
            title="Job type"
            open={openFilters.jobType}
            onToggle={() => toggleFilter("jobType")}
          >
            <ul className="vacancies-filter-list">
              {JOB_TYPE_OPTIONS.map((opt) => {
                const count = facets.job_type[opt.value] ?? 0;
                return (
                  <li key={opt.value}>
                    <label className="vacancies-check">
                      <input
                        type="checkbox"
                        checked={selectedJobTypes.includes(opt.value)}
                        onChange={() => toggleJobType(opt.value)}
                      />
                      <span className="vacancies-check__ui" />
                      <span className="vacancies-check__text">
                        {opt.label} <span className="vacancies-check__count">({count})</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </FilterAccordion>

          <FilterAccordion
            title="Work type"
            open={openFilters.workType}
            onToggle={() => toggleFilter("workType")}
          >
            <ul className="vacancies-filter-list">
              {WORK_TYPE_OPTIONS.map((opt) => {
                const count = facets.work_type[opt.value] ?? 0;
                return (
                  <li key={opt.value}>
                    <label className="vacancies-check">
                      <input
                        type="checkbox"
                        checked={selectedWorkTypes.includes(opt.value)}
                        onChange={() => toggleWorkType(opt.value)}
                      />
                      <span className="vacancies-check__ui" />
                      <span className="vacancies-check__text">
                        {opt.label} <span className="vacancies-check__count">({count})</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </FilterAccordion>

          <FilterAccordion
            title="Skills"
            open={openFilters.skills}
            onToggle={() => toggleFilter("skills")}
          >
            <ul className="vacancies-filter-list vacancies-filter-list--scroll">
              {skillsOptions.map((row) => {
                const name = row.skill;
                const count = row.vacancy_count ?? 0;
                return (
                  <li key={name}>
                    <label className="vacancies-check">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(name)}
                        onChange={() => toggleSkill(name)}
                      />
                      <span className="vacancies-check__ui" />
                      <span className="vacancies-check__text">
                        {name} <span className="vacancies-check__count">({count})</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </FilterAccordion>

          <div className="vacancies-sidebar__actions">
            <button type="button" className="btn btn--primary" onClick={handleSubmit}>
              Apply filters
            </button>
          </div>
        </aside>

        <div className="vacancies-content vacancies-content--redesign">
          <header className="vacancies-results-head">
            <div>
              <h1 className="vacancies-results-head__title">{headline}</h1>
              <p className="vacancies-results-head__meta">
                Search result <span className="vacancies-results-head__count">({totalCount})</span>
              </p>
            </div>
            <div className="vacancies-sort">
              <label htmlFor="vac-sort" className="vacancies-sort__label">
                Sort
              </label>
              <select
                id="vac-sort"
                className="vacancies-sort__select"
                value={ordering}
                onChange={(e) => {
                  const p = buildParams();
                  p.ordering = e.target.value;
                  p.page = 1;
                  setSearchParams(p);
                }}
              >
                <option value="-published_at">Newest</option>
                <option value="published_at">Oldest</option>
                <option value="company">Company A–Z</option>
              </select>
            </div>
          </header>

          {loading ? (
            <div className="vacancies-grid vacancies-grid--loading vacancies-grid--redesign">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="vacancies-card-skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : vacancies.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon empty-state__icon--svg" aria-hidden>
                <IconSearch />
              </div>
              <h3 className="empty-state__title">No vacancies found</h3>
            </div>
          ) : (
            <>
              <div className="vacancies-grid vacancies-grid--redesign">
                {vacancies.map((vacancy, index) => (
                  <VacancyJobCard
                    key={vacancy.id}
                    vacancy={vacancy}
                    index={index}
                    isSaved={savedVacancyIds.has(vacancy.id)}
                    onBookmarkClick={() => handleAddToWatchlist(vacancy.id)}
                  />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav className="vacancies-pagination" aria-label="Pagination">
                  <button
                    type="button"
                    className="btn btn--secondary vacancies-pagination__nav"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <div className="vacancies-pagination__pages">
                    {pageItems.map((item, idx) =>
                      item === "ellipsis" ? (
                        <span key={`e-${idx}`} className="vacancies-pagination__ellipsis">
                          …
                        </span>
                      ) : (
                        <button
                          type="button"
                          key={item}
                          className={`vacancies-pagination__page${item === currentPage ? " is-active" : ""}`}
                          onClick={() => handlePageChange(item)}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn--secondary vacancies-pagination__nav"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
