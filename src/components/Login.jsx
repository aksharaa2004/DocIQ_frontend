import React, { useEffect, useState } from "react";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const query = window.location.hash.split("?")[1] || "";
    const params = new URLSearchParams(query);

    if (params.get("error") === "google_failed") {
      setMessage("Google sign-in failed. Please try again.");
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}#login`,
      );
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role || "user");
        if (data.token) localStorage.setItem("token", data.token);

        setMessage(`Welcome, ${data.user.name}! Login successful.`);

        setTimeout(() => {
          window.location.hash = data.user.role === "admin" ? "admin" : "dashboard";
        }, 1500);
      } else {
        setMessage(data.message || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ================= LEFT SIDE ================= */}

      <div className="login-visual">

        <div className="login-visual-content">

          <a href="#home" className="login-brand">
            <div className="login-brand-icon">
              ✦
            </div>

            <span>DocIQ</span>
          </a>

          <div className="login-message">

            <div className="login-small-badge">
              AI-POWERED LEARNING
            </div>

            <h1>
              Your documents.
              <br />
              <span>Your intelligence.</span>
            </h1>

            <p>
              Turn complex documents into simple,
              understandable knowledge with the power
              of AI.
            </p>

          </div>

          {/* Mini AI Card */}

          <div className="login-ai-card">

            <div className="login-ai-header">

              <div className="login-ai-logo">
                ✦
              </div>

              <div>
                <strong>DocIQ AI</strong>
                <span>Document Assistant</span>
              </div>

              <div className="login-online">
                <span></span>
              </div>

            </div>

            <div className="login-document">

              <div className="login-document-icon">
                PDF
              </div>

              <div className="login-document-info">

                <strong>
                  Machine Learning Notes.pdf
                </strong>

                <span>
                  24 pages • Ready to analyze
                </span>

              </div>

            </div>

            <div className="login-ai-result">

              <div className="result-icon">
                ✦
              </div>

              <div>
                <strong>AI Summary</strong>

                <span>
                  Key concepts identified successfully
                </span>
              </div>

              <div className="result-check">
                ✓
              </div>

            </div>

          </div>

        </div>

        <div className="login-decoration decoration-one"></div>
        <div className="login-decoration decoration-two"></div>
        <div className="login-decoration decoration-three"></div>

      </div>

      {/* ================= RIGHT SIDE ================= */}

      <div className="login-form-area">

        <div className="login-form-container">

          <a href="#home" className="mobile-login-brand">

            <div className="login-brand-icon">
              ✦
            </div>

            <span>DocIQ</span>

          </a>

          <div className="login-heading">

            <div className="login-heading-icon">
              ✦
            </div>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to continue to your documents.
            </p>

          </div>

          <form onSubmit={handleLogin}>

            {/* Email */}

            <div className="form-group">

              <label htmlFor="email">
                Email address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  @
                </span>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

              </div>

            </div>

            {/* Password */}

            <div className="form-group">

              <div className="password-label-row">

                <label htmlFor="password">
                  Password
                </label>

                <a href="#forgot-password">
                  Forgot password?
                </a>

              </div>

              <div className="input-wrapper">

                <span className="input-icon">
                  •••
                </span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* Remember */}

            <div className="remember-row">

              <label className="remember-label">

                <input type="checkbox" />

                <span>
                  Remember me
                </span>

              </label>

            </div>

            {/* Login Message */}

            {message && (
              <p
                className="login-message-status"
                role="alert"
              >
                {message}
              </p>
            )}

            {/* Login Button */}

            <button
              type="submit"
              className="login-submit-button"
              disabled={isLoading}
            >
              <span>
                {isLoading ? "Signing in..." : "Sign In"}
              </span>

              <span>→</span>
            </button>

          </form>

          {/* Divider */}

          <div className="login-divider">

            <span></span>

            <p>
              or continue with
            </p>

            <span></span>

          </div>

          {/* Google */}

          <button
            className="google-login-button"
            type="button"
            onClick={() => {
              window.location.href = "http://localhost:5000/api/auth/google";
            }}
          >
            <span className="google-icon">
              G
            </span>

            Continue with Google
          </button>

          {/* Signup */}

          <div className="signup-text">

            <span>
              Don't have an account?
            </span>

            <a href="#signup">
              Create an account
            </a>

          </div>

          {/* Back */}

          <a href="#home" className="back-home">
            ← Back to DocIQ
          </a>

        </div>

      </div>

    </div>
  );
}

export default Login;

