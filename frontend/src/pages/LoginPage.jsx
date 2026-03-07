import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(formData);

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Sign In</h1>
          <p className="auth-card__subtitle">
            Welcome back! Please enter your credentials
          </p>
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
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error-state">{error}</div>}

          <button type="submit" className="btn btn--primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-form__footer">
          Don't have an account?{" "}
          <Link to="/register" className="auth-form__link">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}