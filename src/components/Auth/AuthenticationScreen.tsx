import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../auth/firebase";
import {
  DEFAULT_ASSESSMENT_EMAIL,
  LocalAuthService,
  type LocalUser,
} from "../../auth/localAuth";

type AuthenticationScreenProps = {
  onLocalLogin: (user: LocalUser) => void;
};

const localAuth = new LocalAuthService();

export function AuthenticationScreen({
  onLocalLogin,
}: AuthenticationScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(DEFAULT_ASSESSMENT_EMAIL);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (mode === "signin" && localAuth.isDefaultEmail(email)) {
      const localUser = localAuth.signIn(email, password);

      if (localUser) {
        onLocalLogin(localUser);
      } else {
        setErrorMessage("The default assessment password is incorrect.");
      }
      return;
    }

    if (!auth) {
      setErrorMessage(
        "Add Firebase values to .env.local to use another account.",
      );
      return;
    }

    const firebaseAction =
      mode === "signup"
        ? createUserWithEmailAndPassword
        : signInWithEmailAndPassword;

    firebaseAction(auth, email, password).catch((error: Error) => {
      setErrorMessage(error.message.replace("Firebase: ", ""));
    });
  }

  function switchMode() {
    setMode((currentMode) => (currentMode === "signin" ? "signup" : "signin"));
    setErrorMessage("");
  }

  return (
    <main className="auth-screen">
      <div className="auth-art">
        <span className="eyebrow">BINAIRE / FREZNEL</span>
        <h1>
          Find the right
          <br />
          <em>weights.</em>
        </h1>
        <p>A calm, precise index for the open model ecosystem.</p>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">FRENZEL API LIST</span>
        <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
        <p className="muted">
          {mode === "signin"
            ? "Use the assessment account offline, or sign in with Firebase."
            : "A Firebase account keeps your workspace personal."}
        </p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            placeholder="6+ characters"
          />
        </label>

        {errorMessage && <p className="form-error">{errorMessage}</p>}
        <button className="button primary" type="submit">
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button className="text-button" type="button" onClick={switchMode}>
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already registered? Sign in"}
        </button>
      </form>
    </main>
  );
}
