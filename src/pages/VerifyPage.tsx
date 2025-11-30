import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authenticateRequest, changeVerifyRequest } from "../Api";
import "./VerifyPage.css";
import { useUser } from "../contexts/UserContext";

type VerifyState = {
  phone_number: string;
  mock?: string;
  user_type?: "TEACHER" | string;
  purpose?: "password";
};

export default function VerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useUser();

  const state = location.state as VerifyState | undefined;

  const phone_number = state?.phone_number ?? "";
  const mock = state?.mock ?? "";
  const user_type = state?.user_type ?? "MODERATOR";
  const purpose = state?.purpose;

  const [token, setToken] = useState(mock);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  // Redirect if missing required data
  useEffect(() => {
    if (!phone_number) {
      navigate("/login", { replace: true });
    }
  }, [phone_number, navigate]);

  // Auto redirect authenticated user
  useEffect(() => {
    if (!purpose && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate, purpose]);

  function validateToken() {
    if (!token.trim()) return "Verification code cannot be empty.";
    return null;
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const validationError = validateToken();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      if (purpose === "password") {
        // Forgot password flow
        await changeVerifyRequest(phone_number, "TEACHER", token);

        setMessage("Code verified! Redirecting...");
        setTimeout(() => {
          navigate("/changeauth", {
            state: { phone_number, change_token: token, user_type },
          });
        }, 500);

      } else {
        // Login verification flow
        const res = await authenticateRequest(
          phone_number,
          "TEACHER",
          token
        );

        login({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          expiration: res.expiration,
          identifier: phone_number,
        });

        navigate("/home", { replace: true });
      }
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Verification failed.";

      setMessage(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="verify-wrap">
      <div className="verify-card fade-in">
        <h1 className="verify-title">
          {purpose ? "Verify your reset code" : "Verify your login"}
        </h1>

        <p className="verify-sub">
          A verification code was sent to{" "}
          <span className="pill">{phone_number}</span>
        </p>

        <form className="verify-form" onSubmit={handleVerify}>
          <label className="label" htmlFor="token">Verification code</label>

          <input
            id="token"
            className="token-input"
            placeholder="Enter code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <button
            className="verify-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Checking..." : "Verify"}
          </button>

          {/* Dev-mode mock autofill */}
          {mock && import.meta.env.DEV && (
            <div className="mock-row">
              <span className="muted">Mock code:</span>
              <code className="code">{mock}</code>
              <button
                type="button"
                className="link-btn"
                onClick={() => setToken(mock)}
              >
                Use
              </button>
            </div>
          )}
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
