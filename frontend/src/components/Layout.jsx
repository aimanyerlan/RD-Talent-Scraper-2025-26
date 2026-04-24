import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const path = location.pathname;
  const isHomePage =
    path === "/" ||
    path.startsWith("/vacancies") ||
    path === "/watchlist" ||
    path === "/profile" ||
    path === "/change-password";

  return (
    <div className={`app-shell ${isHomePage ? "app-shell--home" : ""}`}>
      <Navbar isHomePage={isHomePage} />
      <main className={`page-content ${isHomePage ? "page-content--home" : ""}`}>
        {children ?? <Outlet />}
      </main>
      <Footer isHomePage={isHomePage} />
    </div>
  );
}