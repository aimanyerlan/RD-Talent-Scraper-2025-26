import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchMe } from "../services/api";

export default function Navbar({ isHomePage = false }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("access"))
  );
  const [avatarSrc, setAvatarSrc] = useState("/avatars/avatar-1.jpg");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = Boolean(localStorage.getItem("access"));
      setIsAuthenticated(loggedIn);
      if (loggedIn) {
        try {
          const me = await fetchMe();
          setAvatarSrc(me.avatar_url || "/avatars/avatar-1.jpg");
        } catch {
          setAvatarSrc("/avatars/avatar-1.jpg");
        }
      } else {
        setAvatarSrc("/avatars/avatar-1.jpg");
      }
      setMenuOpen(false);
    };

    const onStorage = () => checkAuth();
    const onAuthChanged = () => checkAuth();
    const onProfileUpdated = () => checkAuth();

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("profile-updated", onProfileUpdated);
    checkAuth();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("profile-updated", onProfileUpdated);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsAuthenticated(false);
    setMenuOpen(false);
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  return (
    <header className={`navbar ${isHomePage ? "navbar--home" : ""}`}>
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
              <Link to="/login" className="btn btn--ghost">Log in</Link>
              <Link to="/register" className="btn btn--primary">Register</Link>
            </>
          ) : (
            <div className="navbar__profile-wrap">
              <button
                type="button"
                className="navbar__profile"
                aria-label="Profile menu"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <img src={avatarSrc} alt="Profile" className="navbar__profile-image" />
              </button>
              {menuOpen && (
                <div className="navbar__profile-menu">
                  <Link to="/profile" className="navbar__profile-item" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <button type="button" className="navbar__profile-item navbar__profile-item--danger" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}