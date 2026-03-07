import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
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

          <div className="footer__section">
            <h4 className="footer__title">Quick Links</h4>
            <ul className="footer__links">
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
              <a href="#" className="footer__social-link">LinkedIn</a>
              <a href="#" className="footer__social-link">GitHub</a>
              <a href="#" className="footer__social-link">Twitter</a>
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
