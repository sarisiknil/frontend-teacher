import { useState } from "react";
import { loginRequest } from "../api/Api";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const [phone_number, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!/^\d{10,15}$/.test(phone_number)) {
      setMessage("Invalid phone format. Example: 905xxxxxxxxx");
      return;
    }

    setLoading(true);

    try {
      const res = await loginRequest(phone_number, "TEACHER", password);

      navigate("/verify-page", {
        state: {
          phone_number,
          mock: res.mock,
        },
      });
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";

      setMessage(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">

      <div className="card">
        <h2>LOGIN</h2>

        <form className="form" onSubmit={handleLogin}>
          <div className="field">
            <label className="label">Phone number</label>
            <div className="inputWrap">
              <input
                type="tel"
                className="input"
                placeholder="905xxxxxxxxx"
                value={phone_number}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                pattern="\d*"
                required
              />
            </div>
            <div className="helper">Use country code, e.g. 905xxxxxxxxx</div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="inputWrap">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter at least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={6}
                required
              />

              <button
                type="button"
                className="eyeBtn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {/* EyeIcon component here */}
              </button>
            </div>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="switch">
          Don't have an account?
          <Link className="switch-link" to="/register"> Register</Link>
        </p>

        <p className="switch">
          <Link className="switch-link" to="/changeauth"> Forgot my password</Link>
        </p>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
