import { useState } from "react";
import { login, register } from "../api";
import { useToast } from "../App";

const ROLES = [
  { id: "Farmer", label: "Farmer", icon: "🚜", desc: "Harvest & register crop batches" },
  { id: "Distributor", label: "Distributor", icon: "🚛", desc: "Transport & update batch logistics" },
  { id: "Retailer", label: "Retailer", icon: "🏪", desc: "Receive & settle crop payments" },
  { id: "Inspector", label: "Inspector", icon: "🔬", desc: "Perform AI crop quality checks" },
];

export default function Login({ onAuthSuccess, onGuestLogin }) {
  const addToast = useToast();
  const [tab, setTab] = useState("login"); // "login" or "register"
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Farmer",
  });

  async function handleLogin(e) {
    e?.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      addToast("Please enter email and password", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await login(loginForm);
      localStorage.setItem("agri_token", res.data.token);
      localStorage.setItem("agri_user", JSON.stringify(res.data.user));
      addToast(`Welcome back, ${res.data.user.name}!`, "success");
      onAuthSuccess(res.data.user);
    } catch (e) {
      addToast(e.response?.data?.error || "Login failed. Please check your credentials.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e?.preventDefault();
    const { name, email, password, confirmPassword, role } = registerForm;
    if (!name || !email || !password) {
      addToast("Please fill in all required fields", "error");
      return;
    }
    if (password.length < 6) {
      addToast("Password must be at least 6 characters", "error");
      return;
    }
    if (password !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await register({ name, email, password, role });
      localStorage.setItem("agri_token", res.data.token);
      localStorage.setItem("agri_user", JSON.stringify(res.data.user));
      addToast(`Account created! Welcome, ${res.data.user.name}`, "success");
      onAuthSuccess(res.data.user);
    } catch (e) {
      addToast(e.response?.data?.error || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoUser() {
    setLoginForm({
      email: "demo@agrichain.com",
      password: "password123",
    });
    // Auto-create demo user if registering
    setRegisterForm({
      name: "Aman Singh",
      email: "demo@agrichain.com",
      password: "password123",
      confirmPassword: "password123",
      role: "Farmer",
    });
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo">🌾</div>
          <h1 className="auth-title">AgriChain</h1>
          <p className="auth-subtitle">
            Blockchain Agricultural Supply Chain & AI Quality Verification
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Sign In Tab */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="name@example.com"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                autoComplete="email"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="btn btn-primary btn-lg btn-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: "8px" }}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Signing in...
                </>
              ) : (
                "Sign In to AgriChain"
              )}
            </button>
          </form>
        )}

        {/* Create Account Tab */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label className="input-label">Full Name *</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Aman Singh"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address *</label>
              <input
                className="input"
                type="email"
                placeholder="name@example.com"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                autoComplete="email"
                required
              />
            </div>

            {/* Role Selection */}
            <div className="input-group">
              <label className="input-label">Your Supply Chain Role</label>
              <div className="role-selector-grid">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`role-choice-card ${
                      registerForm.role === r.id ? "active" : ""
                    }`}
                    onClick={() =>
                      setRegisterForm({ ...registerForm, role: r.id })
                    }
                  >
                    <div className="role-choice-icon">{r.icon}</div>
                    <div className="role-choice-label">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2" style={{ gap: "12px" }}>
              <div className="input-group">
                <label className="input-label">Password *</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm Password *</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Repeat password"
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg btn-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: "8px" }}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Creating Account...
                </>
              ) : (
                "Register & Join Supply Chain"
              )}
            </button>
          </form>
        )}

        {/* Footer Actions & Quick Demo Fill */}
        <div className="auth-footer">
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={fillDemoUser}
              title="Quickly fill sample demo user details"
            >
              ⚡ Fill Demo Data
            </button>
            {onGuestLogin && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onGuestLogin}
                title="Browse public batches as guest"
              >
                👀 Continue as Guest
              </button>
            )}
          </div>
          <div className="auth-security-note">
            🔒 Secured with SQLite DBMS & Polygon Smart Contracts
          </div>
        </div>
      </div>
    </div>
  );
}
