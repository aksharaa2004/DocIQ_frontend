import React, { useState } from "react";
import "./Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (!agreeTerms) {
      setMessage("Please agree to the Terms and Privacy Policy.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Signup successful! Redirecting to Login...");

        setName("");
        setEmail("");
        setPassword("");
        setAgreeTerms(false);

        setTimeout(() => {
          window.location.hash = "login";
        }, 1500);
      } else {
        setMessage(data.message || "Signup failed.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessage("Unable to connect to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* Decorative background */}
      <div className="signup-circle signup-circle-one"></div>
      <div className="signup-circle signup-circle-two"></div>

      <div className="signup-card">
        {/* Brand */}
        <a href="#home" className="signup-brand">
          <span className="signup-brand-icon">✦</span>
          <span>DocIQ</span>
        </a>

        {/* Heading */}
        <div className="signup-heading">
          <div className="signup-heading-icon">✦</div>

          <h1>Create your account</h1>

          <p>
            Start learning smarter with your personal AI document assistant.
          </p>
        </div>

        {/* Signup form */}
        <form onSubmit={handleSignup} className="signup-form">
          {/* Name */}
          <div className="signup-form-group">
            <label htmlFor="signup-name">Full name</label>

            <div className="signup-input-wrapper">
              <span className="signup-input-icon">♙</span>

              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="signup-form-group">
            <label htmlFor="signup-email">Email address</label>

            <div className="signup-input-wrapper">
              <span className="signup-input-icon">@</span>

              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="signup-form-group">
            <label htmlFor="signup-password">Password</label>

            <div className="signup-input-wrapper">
              <span className="signup-input-icon">•••</span>

              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="8"
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p className="signup-password-hint">
              Use at least 8 characters.
            </p>
          </div>

          {/* Terms */}
          <label className="signup-terms">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />

            <span>
              I agree to the{" "}
              <a href="#terms">Terms</a> and{" "}
              <a href="#privacy">Privacy Policy</a>.
            </span>
          </label>

          {/* Message */}
          {message && (
            <p className="signup-message" role="alert">
              {message}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="signup-submit-button"
            disabled={isLoading}
          >
            <span>
              {isLoading ? "Creating account..." : "Create account"}
            </span>

            <span className="signup-arrow">→</span>
          </button>
        </form>

        {/* Login link */}
        <p className="signup-login-text">
          Already have an account?{" "}
          <a href="#login">Sign in</a>
        </p>

        {/* Home link */}
        <a href="#home" className="signup-back-home">
          ← Back to DocIQ
        </a>
      </div>
    </div>
  );
}

export default Signup;