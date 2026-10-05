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

export function SignupPage() {
  const navigate = useNavigate();

  const { authService } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    authService
      .signUp(email, password)
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
          <Heading level={1}>Create account</Heading>

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
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <Content>
            Already have an account? <Link to="/login">Sign in</Link>
          </Content>
        </Form>
      </View>
    </Flex>
  );
}

function getFirebaseErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "Please choose a stronger password.";

    default:
      return "Unable to create the account. Please try again.";
  }
}
