import { useState } from "react";
import { registerRequest } from "../Api";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function RegisterPage() {
  const [phone_number, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function validateFields() {
    if (!/^\d{10,15}$/.test(phone_number)) {
      return "Invalid phone number. Use country code (e.g., 905xxxxxxxxx)";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Invalid email address.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (password.includes(" ")) {
      return "Password cannot contain spaces.";
    }
    return null; // valid
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const validationError = validateFields();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await registerRequest(
        phone_number,
        "TEACHER",
        email,
        password
      );

      // Backend success message
      setMessage(`${res.message} Mock code: ${res.mock}`);

      // Most apps direct to verification
      navigate("/login", {
        state: { phone_number},
      });

    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Registration failed.";

      setMessage(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">

      <div className="card fade-in">
        <h2>Create your account</h2>

        <form className="form" onSubmit={handleRegister}>
          {/* Phone */}
          <div className="field">
            <label className="label">Phone number</label>
            <input
              className="input"
              placeholder="905xxxxxxxxx"
              value={phone_number}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              autoComplete="tel"
              required
            />
            <div className="helper">Use country code format.</div>
          </div>

          {/* Email */}
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="field">
            <label className="label">Password</label>
            <div className="inputWrap">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="eyeBtn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
            <div className="helper">Min 6 chars, no spaces.</div>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="switch">
          Already have an account?
          <Link className="switch-link" to="/login"> Log in</Link>
        </p>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
