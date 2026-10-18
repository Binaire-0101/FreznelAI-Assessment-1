import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService } from "../../auth/AuthService";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const emailRef = useRef(null);
  const pwRef = useRef(null);
  const submitRef = useRef(null);

  // Auto-focus email on mount
  useEffect(() => emailRef.current?.focus(), []);

  // Keyboard navigation (Enter -> Next Field, Escape -> Blur)
  const onKeyDown = (e, next) => {
    if (e.key === "Enter") {
      e.preventDefault();
      next.current?.focus();
    }
    if (e.key === "Escape") e.target.blur();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
      navigate("/"); // Redirect to Dashboard on success
    } catch (err) {
      // Clean up Firebase error messages
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <form onSubmit={submit} className="card-elite">
        {/* Brand Mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40">
            <span className="font-display text-xl text-gold">B</span>
          </div>
          <h1 className="font-display text-3xl tracking-tight text-cream">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-cream-dim">
            Sign in to access your system monitor.
          </p>
        </div>

        {/* Email Input */}
        <label className="mb-1 block text-xs uppercase tracking-widest text-cream-dim">
          Email
        </label>
        <input
          ref={emailRef}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, pwRef)}
          required
          className="input-elite mb-5"
        />

        {/* Password Input */}
        <label className="mb-1 block text-xs uppercase tracking-widest text-cream-dim">
          Password
        </label>
        <input
          ref={pwRef}
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, submitRef)}
          required
          className="input-elite mb-6"
        />

        {/* Submit Button */}
        <button
          ref={submitRef}
          type="submit"
          disabled={loading}
          className="btn-elite"
        >
          {loading ? "Authenticating…" : "Sign In"}
        </button>

        {/* Error Message */}
        {error && (
          <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-cream-dim">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-gold underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signin;
