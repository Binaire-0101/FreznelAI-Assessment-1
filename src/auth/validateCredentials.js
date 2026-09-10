/**
 * Credential validation for the sign-up / sign-in form.
 *
 * Kept separate from the component so it runs (and can be tested) without
 * React, and so the rules live next to the auth service that consumes them.
 * All checks are local, which is why a typo is reported instantly even with no
 * connection - the network is only involved once the input is already valid.
 */
export function validateCredentials(values, isSignUp) {
  const errors = {};

  if (isSignUp && !values.name.trim()) errors.name = 'Tell us what to call you.';

  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'That does not look like a valid email address.';
  }

  if (!values.password) errors.password = 'Password is required.';
  else if (isSignUp && values.password.length < 6) {
    errors.password = 'Use at least 6 characters.';
  }

  if (isSignUp && values.confirm !== values.password) {
    errors.confirm = 'The two passwords do not match.';
  }

  return errors;
}
