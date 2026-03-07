import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("access"))
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("access")));
    };

    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-changed", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-changed", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-mark">R&D</span>
          <span className="navbar__logo-text">R&D Talent Scraper</span>
        </Link>

        <nav className="navbar__nav">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Home
          </NavLink>
          <NavLink 
            to="/vacancies" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Vacancies
          </NavLink>
          <NavLink 
            to="/watchlist" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Watchlist
          </NavLink>
        </nav>

        <div className="navbar__actions">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn--ghost">Sign in</Link>
              <Link to="/register" className="btn btn--primary">Register</Link>
            </>
          ) : (
            <button type="button" className="btn btn--primary" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}