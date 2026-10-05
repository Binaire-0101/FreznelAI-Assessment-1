import { useState } from "react";

import {
  Button,
  Content,
  Form,
  Heading,
  TextField,
  Flex,
  View,
} from "@adobe/react-spectrum";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();

  const { authService } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    authService
      .signIn(email, password)
      .then(() => {
        navigate("/models");
      })
      .catch((error) => {
        console.error(error);

        setError(getFirebaseErrorMessage(error.code));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      padding="size-300"
    >
      <View width="size-4600" padding="size-400">
        <Form onSubmit={handleSubmit}>
          <Heading level={1}>Sign in</Heading>

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            isRequired
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            isRequired
          />

          {error && <Content>{error}</Content>}

          <Button type="submit" variant="accent" isDisabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <Content>
            Don't have an account? <Link to="/signup">Create an account</Link>
          </Content>
        </Form>
      </View>
    </Flex>
  );
}

function getFirebaseErrorMessage(code) {
  switch (code) {
    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/user-not-found":
      return "No account exists with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    default:
      return "Unable to sign in. Please try again.";
  }
}
