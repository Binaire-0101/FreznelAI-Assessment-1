export type LocalUser = {
  email: string;
  isLocalUser: true;
};

export const DEFAULT_ASSESSMENT_EMAIL = "nikhil.kumar.yadav.0201@gmail.com";

const DEFAULT_ASSESSMENT_PASSWORD = "nanashi0210";
const STORAGE_KEY = "model-atlas-local-user";

const demoLoginEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true";

export class LocalAuthService {
  isDefaultEmail(email: string): boolean {
    return email.trim().toLowerCase() === DEFAULT_ASSESSMENT_EMAIL;
  }

  signIn(email: string, password: string): LocalUser | null {
    if (!demoLoginEnabled) return null;

    if (
      !this.isDefaultEmail(email) ||
      password !== DEFAULT_ASSESSMENT_PASSWORD
    ) {
      return null;
    }

    const user = {
      email: DEFAULT_ASSESSMENT_EMAIL,
      isLocalUser: true as const,
    };
    window.localStorage.setItem(STORAGE_KEY, user.email);
    return user;
  }

  getSavedUser(): LocalUser | null {
    if (!demoLoginEnabled || !window.localStorage.getItem(STORAGE_KEY)) {
      return null;
    }

    return { email: DEFAULT_ASSESSMENT_EMAIL, isLocalUser: true };
  }

  signOut(): void {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
