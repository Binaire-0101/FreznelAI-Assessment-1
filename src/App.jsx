import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ModelsPage } from "./pages/ModelsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/models" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/models"
        element={
          <ProtectedRoute>
            <ModelsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/models" replace />} />
    </Routes>
  );
}

export default App;
