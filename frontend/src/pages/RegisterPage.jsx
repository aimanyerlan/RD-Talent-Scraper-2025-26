import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirm: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await registerUser(formData);
      setSuccess("Registration completed successfully. You can now log in.");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err.message || "Registration failed. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">
            Join us to start tracking R&D jobs
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
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password_confirm">Confirm Password</label>
            <input
              id="password_confirm"
              type="password"
              name="password_confirm"
              placeholder="Repeat your password"
              value={formData.password_confirm}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error-state">{error}</div>}
          {success && (
            <div style={{ padding: 'var(--spacing-md)', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 'var(--radius-sm)', color: '#065f46' }}>
              {success}
            </div>
          )}

          <button type="submit" className="btn btn--primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="auth-form__footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-form__link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}