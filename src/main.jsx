import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Dashboard from "./pages/Dashboard";
import "./styles/index.css";
import { Signup } from "./pages/Auth/Signup";
import Signin from "./pages/Auth/Signin";

function Guard({ children }) {
  const { user, isLoading } = useAuth();

  console.log("user", user);

  if (isLoading) return <p style={{ padding: 24 }}>Loading…</p>;
  return user ? children : <Navigate to="/signin" />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route
            path="/"
            element={
              <Guard>
                <Dashboard />
              </Guard>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
