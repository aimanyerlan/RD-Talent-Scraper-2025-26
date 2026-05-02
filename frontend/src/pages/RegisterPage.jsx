import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import { IconEye, IconEyeOff } from "../components/AuthIcons";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    password_confirm: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setLoading(true);

    if (formData.password !== formData.password_confirm) {
      setFieldErrors({ password_confirm: "Passwords do not match." });
      setLoading(false);
      return;
    }

    try {
      await registerUser(formData);
      navigate("/email-verification-sent");
    } catch (err) {
      const message = err.message || "Registration failed. Please check your input.";
      const nextErrors = {};
      if (message.toLowerCase().includes("email")) {
        nextErrors.email = message;
      } else if (message.toLowerCase().includes("password")) {
        nextErrors.password = message;
      } else if (message.toLowerCase().includes("full")) {
        nextErrors.full_name = message;
      } else {
        nextErrors.email = message;
      }
      setFieldErrors(nextErrors);
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
      <div className="auth-split auth-split--image">
        <div className="auth-split__left" aria-hidden />

        <div className="auth-card auth-card--split">
          <div className="auth-card__header">
            <h1 className="auth-card__title">Create account</h1>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                type="text"
                name="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleChange}
                className={fieldErrors.full_name ? "auth-input-error" : ""}
                required
              />
              {fieldErrors.full_name && <p className="auth-field-error">{fieldErrors.full_name}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={fieldErrors.email ? "auth-input-error" : ""}
                required
              />
              {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  className={fieldErrors.password ? "auth-input-error" : ""}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="password_confirm">Repeat Password</label>
              <div className="auth-password-wrap">
                <input
                  id="password_confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirm"
                  placeholder="Repeat your password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className={fieldErrors.password_confirm ? "auth-input-error" : ""}
                  required
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
              {fieldErrors.password_confirm && (
                <p className="auth-field-error">{fieldErrors.password_confirm}</p>
              )}
            </div>

            <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
          <div className="auth-form__footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-form__link">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}