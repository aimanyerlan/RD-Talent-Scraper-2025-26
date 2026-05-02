import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchMe, logoutUser } from "../services/api";

function NavLinks({ className, onNavigate, itemClassName }) {
  const linkClass = ({ isActive }) =>
    `${itemClassName || "nav-link"}${isActive ? " active" : ""}`;

  return (
    <nav className={className} aria-label="Main navigation">
      <NavLink to="/" end className={linkClass} onClick={onNavigate}>
        Home
      </NavLink>
      <NavLink to="/vacancies" className={linkClass} onClick={onNavigate}>
        Vacancies
      </NavLink>
      <NavLink to="/watchlist" className={linkClass} onClick={onNavigate}>
        Watchlist
      </NavLink>
    </nav>
  );
}

export default function Navbar({ isHomePage = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const useCookieAuth = import.meta.env.VITE_USE_COOKIE_AUTH === "true";
  const [isAuthenticated, setIsAuthenticated] = useState(
    useCookieAuth ? false : Boolean(localStorage.getItem("access"))
  );
  const [avatarSrc, setAvatarSrc] = useState("/avatars/avatar-1.jpg");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMobileNavOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [location.pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = useCookieAuth ? true : Boolean(localStorage.getItem("access"));
      setIsAuthenticated(loggedIn);
      if (loggedIn) {
        try {
          const me = await fetchMe();
          setAvatarSrc(me.avatar_url || "/avatars/avatar-1.jpg");
          setIsAuthenticated(true);
        } catch {
          setAvatarSrc("/avatars/avatar-1.jpg");
          setIsAuthenticated(false);
        }
      } else {
        setAvatarSrc("/avatars/avatar-1.jpg");
      }
      setProfileMenuOpen(false);
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
  }, [useCookieAuth]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setProfileMenuOpen(false);
    setMobileNavOpen(false);
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  return (
    <header className={`navbar ${isHomePage ? "navbar--home" : ""}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-mark">R&D</span>
        </Link>

        <NavLinks className="navbar__nav navbar__nav--desktop" />

        <div className="navbar__trailing">
          <button
            type="button"
            className="navbar__menu-btn"
            aria-expanded={mobileNavOpen}
            aria-controls="navbar-mobile-menu"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            <span className={`navbar__menu-icon${mobileNavOpen ? " is-open" : ""}`} aria-hidden />
          </button>

          <div className="navbar__actions">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn--ghost navbar__auth-btn">
                  Log in
                </Link>
                <Link to="/register" className="btn btn--primary navbar__auth-btn">
                  Register
                </Link>
              </>
            ) : (
              <div className="navbar__profile-wrap">
                <button
                  type="button"
                  className="navbar__profile"
                  aria-label="Profile menu"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                >
                  <img src={avatarSrc} alt="" className="navbar__profile-image" />
                </button>
                {profileMenuOpen ? (
                  <div className="navbar__profile-menu">
                    <Link
                      to="/profile"
                      className="navbar__profile-item"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      className="navbar__profile-item navbar__profile-item--danger"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="navbar__backdrop"
            aria-label="Close navigation menu"
            tabIndex={-1}
            onClick={() => setMobileNavOpen(false)}
          />
          <div id="navbar-mobile-menu" className="navbar__mobile-drawer">
            <NavLinks
              className="navbar__mobile-nav"
              itemClassName="navbar__mobile-link"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </>
      ) : null}
    </header>
  );
}