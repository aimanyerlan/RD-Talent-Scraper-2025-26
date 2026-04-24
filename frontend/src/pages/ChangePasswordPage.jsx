import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword } from "../services/api";
import { IconEye, IconEyeOff } from "../components/AuthIcons";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login", { replace: true, state: { from: "/change-password" } });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword, passwordConfirm);
      setMessage("Password updated.");
      setOldPassword("");
      setNewPassword("");
      setPasswordConfirm("");
      window.setTimeout(() => {
        navigate("/profile", { replace: true, state: { passwordUpdated: true } });
      }, 600);
    } catch (err) {
      setError(err.message || "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container home-page profile-page">
      <div className="profile-card">
        <Link to="/profile" className="profile-back-link">
          Back to profile
        </Link>

        <div className="profile-header profile-header--solo">
          <div className="profile-header__content">
            <h1 className="profile-title">Change password</h1>
          </div>
        </div>

        <form className="profile-form profile-form--personal profile-form--change-password" onSubmit={handleSubmit}>
          <div className="form-field profile-field">
            <label htmlFor="cp-old">Current password</label>
            <div className="auth-password-wrap">
              <input
                id="cp-old"
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowOld((v) => !v)}
                aria-label={showOld ? "Hide password" : "Show password"}
              >
                {showOld ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <div className="form-field profile-field">
            <label htmlFor="cp-new">New password</label>
            <div className="auth-password-wrap">
              <input
                id="cp-new"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <div className="form-field profile-field">
            <label htmlFor="cp-confirm">Confirm new password</label>
            <div className="auth-password-wrap">
              <input
                id="cp-confirm"
                type={showConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {error ? <p className="auth-field-error">{error}</p> : null}
          {message ? <p className="profile-message">{message}</p> : null}

          <div className="profile-change-password__actions">
            <button type="submit" className="btn btn--primary profile-save-btn" disabled={submitting}>
              {submitting ? "Saving…" : "Update password"}
            </button>
            <Link to="/profile" className="btn btn--ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
