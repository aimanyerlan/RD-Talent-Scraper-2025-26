import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/api";
import { IconEye, IconEyeOff } from "../components/AuthIcons";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const linkIsValid = useMemo(() => Boolean(uid && token), [uid, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        uid,
        token,
        new_password: newPassword,
        password_confirm: confirmPassword,
      });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <span className="auth-brand__mark">R&D</span>
        <span className="auth-brand__text">R&D Talent Scraper</span>
      </Link>
      <div className="auth-card auth-card--status">
        <div className="auth-status-icon">!</div>
        <h1 className="auth-card__title">Create New Password</h1>
        <p className="auth-card__subtitle">Use a strong password you have not used before.</p>
        {!linkIsValid && <p className="auth-field-error">Invalid reset link.</p>}
        {error && <p className="auth-field-error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="newPassword">New password</label>
            <div className="auth-password-wrap">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                disabled={!linkIsValid}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="confirmPassword">Repeat password</label>
            <div className="auth-password-wrap">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={!linkIsValid}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn--primary auth-submit" disabled={loading || !linkIsValid}>
            {loading ? "Saving..." : "Reset Password"}
          </button>
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
