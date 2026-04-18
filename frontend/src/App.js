import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Services from "@/pages/Services";
import ServiceTypes from "@/pages/ServiceTypes";
import Calendar from "@/pages/Calendar";
import ReportesLista from "@/pages/ReportesLista";
import CrearReporte from "@/pages/CrearReporte";
import ReporteDetalle from "@/pages/ReporteDetalle";
import Configuracion from "@/pages/Configuracion";
import Inventario from "@/pages/Inventario";
import Chat from "@/pages/Chat";

// Constantes de roles para evitar inline arrays (mejor performance)
const ADMIN_SUPERVISOR_ROLES = ["admin", "supervisor"];
const ADMIN_ONLY_ROLES = ["admin"];
const TECHNICAL_ROLES = ["admin", "supervisor", "tecnico"];

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
                  <ProtectedRoute allowedRoles={ADMIN_SUPERVISOR_ROLES}>
                    <Users />
                  </ProtectedRoute>
                }
              />

              {/* Servicios - Todos excepto rol inexistente */}
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <Services />
                  </ProtectedRoute>
                }
              />

              {/* Tipos de Servicios - Solo Admin y Supervisor */}
              <Route
                path="/service-types"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_SUPERVISOR_ROLES}>
                    <ServiceTypes />
                  </ProtectedRoute>
                }
              />

              {/* Calendario - Todos pueden ver */}
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />

              {/* Reportes - Técnicos, Supervisores y Admin */}
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute allowedRoles={TECHNICAL_ROLES}>
                    <ReportesLista />
                  </ProtectedRoute>
                }
              />

              {/* Crear Reporte */}
              <Route
                path="/reportes/crear"
                element={
                  <ProtectedRoute allowedRoles={TECHNICAL_ROLES}>
                    <CrearReporte />
                  </ProtectedRoute>
                }
              />

              {/* Detalle de Reporte */}
              <Route
                path="/reportes/:id"
                element={
                  <ProtectedRoute allowedRoles={TECHNICAL_ROLES}>
                    <ReporteDetalle />
                  </ProtectedRoute>
                }
              />

              {/* Configuración - Solo Admin */}
              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}>
                    <Configuracion />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/inventory"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_SUPERVISOR_ROLES}>
                    <Inventario />
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
