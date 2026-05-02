import { Link } from "react-router-dom";

export default function Footer({ isHomePage = false }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`footer ${isHomePage ? "footer--home" : ""}`}>
      <div className="container">
        <div className="footer__content">
          <div className="footer__section">
            <div className="footer__logo">
              <div className="footer__logo-mark">R&D</div>
              <span className="footer__logo-text">R&D Talent Scraper</span>
            </div>
            <p className="footer__description">
              Your trusted platform for discovering research and development opportunities from top companies worldwide.
            </p>
          </div>

          <div className="footer__section footer__section--quick-links">
            <h4 className="footer__title">Quick Links</h4>
            <ul className="footer__links footer__links--quick">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/vacancies">Vacancies</Link></li>
              <li><Link to="/watchlist">Watchlist</Link></li>
            </ul>
          </div>

          <div className="footer__section">
            <h4 className="footer__title">Resources</h4>
            <ul className="footer__links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="footer__section">
            <h4 className="footer__title">Connect</h4>
            <p className="footer__contact">
              Find the best R&D opportunities tailored to your skills and expertise.
            </p>
            <div className="footer__social">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="footer__social-link"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="footer__social-icon">
                  <path d="M4.98 3.5a2.48 2.48 0 1 0 0 4.96 2.48 2.48 0 0 0 0-4.96ZM3 9h4v12H3zM10 9h3.83v1.71h.05c.53-1.01 1.83-2.08 3.77-2.08 4.03 0 4.77 2.65 4.77 6.09V21h-4v-5.54c0-1.32-.02-3.02-1.84-3.02-1.84 0-2.12 1.44-2.12 2.93V21h-4z" />
                </svg>
              </a>
              <a
                href="https://hh.kz"
                target="_blank"
                rel="noreferrer"
                className="footer__social-link"
                aria-label="HeadHunter"
                title="HeadHunter"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="footer__social-icon">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M7 8v8M10 8v8M7 12h3M14 8v8M17 8v8M14 12h3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
              <a
                href="mailto:hello@rdtalentscraper.com"
                className="footer__social-link"
                aria-label="Email"
                title="Email"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="footer__social-icon">
                  <path d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 2v.2l9 5.4 9-5.4V8l-9 5.4L3 8Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} R&D Talent Scraper. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
