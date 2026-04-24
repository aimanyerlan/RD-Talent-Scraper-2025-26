import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await requestPasswordReset(email);
      navigate("/password-reset-sent");
    } catch {
      setError("Failed to request password reset.");
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <span className="auth-brand__mark">R&D</span>
        <span className="auth-brand__text">R&D Talent Scraper</span>
      </Link>
      <div className="auth-card auth-card--status">
        <div className="auth-status-icon">?</div>
        <h1 className="auth-card__title">Forgot Password?</h1>
        <p className="auth-card__subtitle">Enter your email and we will send you a reset link.</p>

        {error && <p className="auth-field-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="email"></label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary auth-submit">Send Reset Link</button>
        </form>

        <div className="auth-form__footer">
          <Link to="/login" className="auth-form__link">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}