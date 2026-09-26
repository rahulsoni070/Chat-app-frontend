import React, { useState } from "react";
import { api, errorMessage } from "../api";

const MODES = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to pick up where you left off.",
    action: "Sign in",
    busy: "Signing in…",
    endpoint: "/auth/login",
  },
  register: {
    title: "Create your account",
    subtitle: "Pick a username and start chatting in seconds.",
    action: "Create account",
    busy: "Creating account…",
    endpoint: "/auth/register",
  },
};

const AuthPage = ({ onAuth }) => {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const copy = MODES[mode];

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = username.trim();

    if (!name || !password) {
      setError("Please enter a username and password.");
      return;
    }
    if (mode === "register" && name.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (mode === "register" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { data } = await api.post(copy.endpoint, { username: name, password });
      onAuth({ username: data.username, token: data.token });
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-hero" aria-hidden="true">
        <div className="brand brand-lg">
          <span className="brand-mark">💬</span>
          <span>Chatter</span>
        </div>
        <p className="auth-tagline">
          Real-time private messaging with typing indicators, read receipts
          and emoji.
        </p>
        <div className="hero-bubbles">
          <div className="hero-bubble in">Hey! Are you there? 👋</div>
          <div className="hero-bubble out">Just logged in 🎉</div>
          <div className="hero-bubble in">Typing indicators, nice!</div>
        </div>
      </section>

      <section className="auth-card">
        <div className="brand brand-mobile">
          <span className="brand-mark">💬</span>
          <span>Chatter</span>
        </div>

        <div className="segmented" role="tablist" aria-label="Authentication mode">
          {Object.keys(MODES).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              className={mode === key ? "active" : ""}
              onClick={() => switchMode(key)}
            >
              {key === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <h1 className="auth-title">{copy.title}</h1>
        <p className="auth-subtitle">{copy.subtitle}</p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="e.g. rahul"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="link-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? copy.busy : copy.action}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            className="link-btn"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
};

export default AuthPage;
