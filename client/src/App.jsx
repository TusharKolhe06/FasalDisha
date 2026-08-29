import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import OfflineBanner from "./components/OfflineBanner";

import { OfflineProvider } from "./context/OfflineContext";
import OfflineStatus from "./components/OfflineStatus";


import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Markets from "./pages/Markets";
import Marketplace from "./pages/Marketplace";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <OfflineProvider>
      <BrowserRouter>

        <Navbar />

        {/* Offline Status */}
        <OfflineBanner />
        <OfflineStatus />

        <Routes>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/markets"
            element={<Markets />}
          />

          <Route
            path="/marketplace"
            element={<Marketplace />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

        </Routes>

        <footer>
          © 2026 FasalDisha • SIH26132 Prototype
        </footer>

      </BrowserRouter>
    </OfflineProvider>
  );
}