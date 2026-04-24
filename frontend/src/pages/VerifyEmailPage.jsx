import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../services/api";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const linkInvalid = !uid || !token;

  const [message, setMessage] = useState(() => (linkInvalid ? "" : "Verifying your email..."));
  const [error, setError] = useState(() => (linkInvalid ? "Invalid email verification link." : ""));

  useEffect(() => {
    if (linkInvalid) {
      return;
    }

    let cancelled = false;
    verifyEmail(uid, token)
      .then(() => {
        if (!cancelled) {
          setError("");
          setMessage("Email verified successfully.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage("");
          setError(err.message || "Could not verify email.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid, token, linkInvalid]);

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <span className="auth-brand__mark">R&D</span>
        <span className="auth-brand__text">R&D Talent Scraper</span>
      </Link>
      <div className="auth-card auth-card--status">
        <div className="auth-status-icon">{error ? "x" : "@"}</div>
        <h1 className="auth-card__title">Email Verification</h1>
        {message && <p className="auth-status-message">{message}</p>}
        {error && <p className="auth-field-error">{error}</p>}
        <Link to="/login" className="btn btn--primary auth-submit">
          Log in
        </Link>
      </div>
    </div>
  );
}
