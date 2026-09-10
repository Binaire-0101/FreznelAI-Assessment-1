import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  ButtonGroup,
  Checkbox,
  Divider,
  Flex,
  Form,
  Heading,
  InlineAlert,
  Content,
  ProgressCircle,
  Text,
  TextField,
  View,
} from '@adobe/react-spectrum';
import { useAuth } from '../../hooks/useAuth.js';
import { validateCredentials } from '../../auth/validateCredentials.js';
import { NetworkPill } from '../Layout/NetworkStatus.jsx';

/**
 * Sign-up / sign-in screen.
 *
 * One form serves both modes so the fields never jump around; switching mode
 * slides the panel and only adds the two extra sign-up fields. Validation runs
 * locally before any request goes out, which means a typo is reported instantly
 * even with no connection.
 */

const MODES = {
  SIGN_UP: 'signUp',
  SIGN_IN: 'signIn',
};

export function AuthScreen({ online }) {
  const { signUp, signIn, signInWithGoogle, resetPassword, demo } = useAuth();

  const [mode, setMode] = useState(MODES.SIGN_UP);
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === MODES.SIGN_UP;

  const errors = useMemo(() => validateCredentials(values, isSignUp), [values, isSignUp]);
  const isValid = Object.keys(errors).length === 0;

  const update = useCallback((key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError(null);
  }, []);

  const markTouched = useCallback((key) => {
    setTouched((previous) => ({ ...previous, [key]: true }));
  }, []);

  const switchMode = useCallback((next) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setTouched({});
  }, []);

  const submit = useCallback(
    (event) => {
      if (event && event.preventDefault) event.preventDefault();
      setTouched({ name: true, email: true, password: true, confirm: true });
      if (!isValid || busy) return;

      setBusy(true);
      setError(null);

      const request = isSignUp
        ? signUp({ email: values.email, password: values.password, displayName: values.name })
        : signIn({ email: values.email, password: values.password });

      request
        .catch((caught) => setError(caught.message))
        .then(() => setBusy(false));
    },
    [busy, isSignUp, isValid, signIn, signUp, values],
  );

  const google = useCallback(() => {
    setBusy(true);
    setError(null);
    signInWithGoogle()
      .catch((caught) => setError(caught.message))
      .then(() => setBusy(false));
  }, [signInWithGoogle]);

  const forgot = useCallback(() => {
    if (!values.email) {
      setError('Enter your email address first, then choose "Forgot password".');
      return;
    }
    setBusy(true);
    resetPassword(values.email)
      .then(() => setNotice(`Password reset link sent to ${values.email}.`))
      .catch((caught) => setError(caught.message))
      .then(() => setBusy(false));
  }, [resetPassword, values.email]);

  return (
    <div className="auth-screen">
      <aside className="auth-brand">
        <div className="auth-brand__glow" aria-hidden="true" />
        <div className="auth-brand__inner">
          <div className="auth-brand__mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <Heading level={1} UNSAFE_className="auth-brand__title">
            Model&nbsp;Finder
          </Heading>
          <p className="auth-brand__lede">
            Search, filter and rank thousands of open models by pipeline, family,
            architecture, weight format and safetensor footprint — online or off.
          </p>
          <ul className="auth-brand__points">
            <li>
              <strong>Ranked substring search</strong>
              <span>Prefix and mid-word matches, debounced and throttled.</span>
            </li>
            <li>
              <strong>Five live facets</strong>
              <span>Counts update against whatever you are already looking at.</span>
            </li>
            <li>
              <strong>Verified offline snapshot</strong>
              <span>Checksummed catalogue in IndexedDB — the full app, no network.</span>
            </li>
          </ul>
        </div>
      </aside>

      <main className="auth-panel">
        <Flex justifyContent="end" marginBottom="size-200">
          <NetworkPill online={online} />
        </Flex>

        <View UNSAFE_className="auth-card" key={mode}>
          <Heading level={2} UNSAFE_className="auth-card__title">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Heading>
          <Text UNSAFE_className="auth-card__subtitle">
            {isSignUp
              ? 'Sign up to start exploring the model catalogue.'
              : 'Sign in to pick up where you left off.'}
          </Text>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={isSignUp}
              className={`auth-tabs__tab ${isSignUp ? 'is-active' : ''}`}
              onClick={() => switchMode(MODES.SIGN_UP)}
            >
              Sign up
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isSignUp}
              className={`auth-tabs__tab ${!isSignUp ? 'is-active' : ''}`}
              onClick={() => switchMode(MODES.SIGN_IN)}
            >
              Sign in
            </button>
            <span className={`auth-tabs__indicator ${isSignUp ? '' : 'is-right'}`} aria-hidden="true" />
          </div>

          {demo ? (
            <InlineAlert variant="info" marginTop="size-200" width="100%">
              <Heading>Demo auth mode</Heading>
              <Content>
                No Firebase project is configured, so sign-in is simulated locally. Add your
                <code> VITE_FIREBASE_* </code> values to <code>.env.local</code> to use Firebase Authentication.
              </Content>
            </InlineAlert>
          ) : null}

          {error ? (
            <InlineAlert variant="negative" marginTop="size-200" width="100%">
              <Heading>{isSignUp ? 'Could not create the account' : 'Could not sign in'}</Heading>
              <Content>{error}</Content>
            </InlineAlert>
          ) : null}

          {notice ? (
            <InlineAlert variant="positive" marginTop="size-200" width="100%">
              <Heading>Check your inbox</Heading>
              <Content>{notice}</Content>
            </InlineAlert>
          ) : null}

          <Form onSubmit={submit} marginTop="size-250" width="100%" maxWidth="100%">
            <div className={`auth-fields ${isSignUp ? 'auth-fields--expanded' : ''}`}>
              {isSignUp ? (
                <TextField
                  label="Display name"
                  value={values.name}
                  onChange={(value) => update('name', value)}
                  onBlur={() => markTouched('name')}
                  validationState={touched.name && errors.name ? 'invalid' : undefined}
                  errorMessage={errors.name}
                  autoComplete="name"
                  width="100%"
                />
              ) : null}

              <TextField
                label="Email"
                type="email"
                value={values.email}
                onChange={(value) => update('email', value)}
                onBlur={() => markTouched('email')}
                validationState={touched.email && errors.email ? 'invalid' : undefined}
                errorMessage={errors.email}
                autoComplete="email"
                width="100%"
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={(value) => update('password', value)}
                onBlur={() => markTouched('password')}
                validationState={touched.password && errors.password ? 'invalid' : undefined}
                errorMessage={errors.password}
                description={isSignUp ? 'At least 6 characters.' : undefined}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                width="100%"
              />

              {isSignUp ? (
                <TextField
                  label="Confirm password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.confirm}
                  onChange={(value) => update('confirm', value)}
                  onBlur={() => markTouched('confirm')}
                  validationState={touched.confirm && errors.confirm ? 'invalid' : undefined}
                  errorMessage={errors.confirm}
                  autoComplete="new-password"
                  width="100%"
                />
              ) : null}
            </div>

            <Flex justifyContent="space-between" alignItems="center" marginTop="size-150" wrap>
              <Checkbox isSelected={showPassword} onChange={setShowPassword}>
                Show password
              </Checkbox>
              {!isSignUp ? (
                <button type="button" className="auth-link" onClick={forgot}>
                  Forgot password?
                </button>
              ) : null}
            </Flex>

            <ButtonGroup marginTop="size-250" width="100%">
              <Button variant="accent" type="submit" isDisabled={busy} UNSAFE_className="auth-submit">
                {busy ? (
                  <Flex alignItems="center" gap="size-100">
                    <ProgressCircle size="S" isIndeterminate aria-label="Working" />
                    <Text>Please wait…</Text>
                  </Flex>
                ) : (
                  <Text>{isSignUp ? 'Create account' : 'Sign in'}</Text>
                )}
              </Button>
            </ButtonGroup>
          </Form>

          <Divider size="S" marginTop="size-300" marginBottom="size-200" />

          <Button variant="secondary" style="outline" width="100%" onPress={google} isDisabled={busy}>
            <Text>Continue with Google</Text>
          </Button>

          {!online ? (
            <Text UNSAFE_className="auth-offline-note" marginTop="size-200">
              You are offline. A brand-new sign-in needs a connection, but an account you have
              already used on this device will be restored automatically.
            </Text>
          ) : null}
        </View>
      </main>
    </div>
  );
}
