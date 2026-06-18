"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setBusy(true);
    setError("");
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) setError(result.error || "Login failed");
  };

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="login-bg-shape s1" />
        <div className="login-bg-shape s2" />
      </div>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">G</div>
          <div className="login-brand-text">
            <span className="login-brand-name">BrandG</span>
            <span className="login-brand-sub">Admin Panel</span>
          </div>
        </div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-desc">Sign in to manage your brand</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@brandg.com"
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={busy}>
            {busy ? (
              <span className="login-btn-loading">
                <span className="spinner-sm" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
