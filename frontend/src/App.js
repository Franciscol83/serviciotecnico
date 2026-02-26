import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";

// Componente para redirigir al dashboard o login
const Home = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              {/* Ruta raíz */}
              <Route path="/" element={<Home />} />

              {/* Login */}
              <Route path="/login" element={<Login />} />

              {/* Dashboard - Protegido */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Usuarios - Solo Admin y Supervisor */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                    <Users />
                  </ProtectedRoute>
                }
              />

              {/* Placeholder para futuras rutas */}
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Servicios</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Próximamente en Fase 2</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendario</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Próximamente en Fase 3</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventario</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Próximamente en Fase 5</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Próximamente en Fase 4</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Próximamente en Fase 7</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">Página no encontrada</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
