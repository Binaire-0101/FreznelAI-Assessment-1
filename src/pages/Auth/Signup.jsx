import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService } from "../../auth/AuthService";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const emailRef = useRef(null);
  const pwRef = useRef(null);
  const submitRef = useRef(null);

  useEffect(() => emailRef.current?.focus(), []);

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
      await AuthService.signUp(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <form onSubmit={submit} className="card-elite">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40">
            <span className="font-display text-xl text-gold">B</span>
          </div>
          <h1 className="font-display text-3xl tracking-tight text-cream">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-cream-dim">
            Join Binaire Freznel — precision in every detail.
          </p>
        </div>

        {/* Email */}
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

        {/* Password */}
        <label className="mb-1 block text-xs uppercase tracking-widest text-cream-dim">
          Password
        </label>
        <input
          ref={pwRef}
          type="password"
          placeholder="Minimum 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, submitRef)}
          required
          minLength={6}
          className="input-elite mb-6"
        />

        {/* Submit */}
        <button
          ref={submitRef}
          type="submit"
          disabled={loading}
          className="btn-elite"
        >
          {loading ? "Creating…" : "Sign Up"}
        </button>

        {/* Error */}
        {error && (
          <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-cream-dim">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-medium text-gold underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export { Signup };
