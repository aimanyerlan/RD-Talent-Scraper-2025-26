import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleLogin, loginUser } from "../services/api";
import { IconEye, IconEyeOff } from "../components/AuthIcons";

export default function LoginPage() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id || !googleButtonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const data = await googleLogin(response.credential);
          if (data.access && data.refresh) {
            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh);
          }
          window.dispatchEvent(new Event("auth-changed"));
          navigate("/");
          window.location.reload();
        } catch (error) {
          setFieldErrors({ email: error.message || "Google login failed." });
        }
      },
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      width: 330,
      text: "signin_with",
      shape: "pill",
    });
  }, [navigate]);

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

    try {
      const data = await loginUser(formData);

      if (data.access && data.refresh) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
      }
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/");
      window.location.reload();
    } catch (err) {
      const message = err.message || "Invalid email or password.";
      if (message.toLowerCase().includes("confirm your email")) {
        setFieldErrors({ email: message });
      } else {
        setFieldErrors({
          email: "Invalid email or password.",
          password: "Invalid email or password.",
        });
      }
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
            <h1 className="auth-card__title">Log in</h1>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="Enter your password"
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

            <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "8px" }}>
              <Link to="/forgot-password" className="auth-form__link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          <div className="auth-google-wrap">
            <div ref={googleButtonRef} />
          </div>
          <div className="auth-form__footer">
            Don't have an account?{" "}
            <Link to="/register" className="auth-form__link">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}