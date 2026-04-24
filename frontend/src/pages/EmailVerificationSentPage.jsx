import { Link } from "react-router-dom";

export default function EmailVerificationSentPage() {
  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <span className="auth-brand__mark">R&D</span>
        <span className="auth-brand__text">R&D Talent Scraper</span>
      </Link>
      <div className="auth-card auth-card--status">
        <div className="auth-status-icon">@</div>
        <h1 className="auth-card__title">Check Your Email</h1>
        <p className="auth-status-message">We sent a confirmation link to your inbox.</p>
        <div className="auth-form__footer">
          <Link to="/login" className="auth-form__link">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
