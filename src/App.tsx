import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  TableProperties,
  FileText,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
  History
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import Apartments from "./components/Apartments";
import Contributions from "./components/Contributions";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import AuditLogs from "./pages/AuditLogs";
import Landing from "./pages/Landing";

import Login from "./auth/Login";
import Register from "./auth/Register";

import { supabase } from "./lib/supabase";
import { Building } from "./types";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { auditService } from "./services/auditService";

type Page =
  | "dashboard"
  | "apartments"
  | "contributions"
  | "reports"
  | "settings"
  | "audit";

function MainApp() {
  const { signOut } = useAuth();

  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBuilding() {
      const { data } = await supabase
        .from("buildings")
        .select("*")
        .limit(1)
        .single();

      if (data) setBuilding(data);

      setLoading(false);
    }

    fetchBuilding();
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "apartments", label: "Apartments", icon: Building2 },
    { id: "contributions", label: "Contributions", icon: TableProperties },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "audit", label: "Audit Logs", icon: History },
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            building={building}
            onAddPayment={() => setCurrentPage("contributions")}
            onViewApartments={() => setCurrentPage("apartments")}
          />
        );

      case "apartments":
        return <Apartments building={building} />;

      case "contributions":
        return <Contributions building={building} />;

      case "reports":
        return <Reports building={building} />;

      case "audit":
        return <AuditLogs building={building} />;

      case "settings":
        return <Settings building={building} onUpdate={setBuilding} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">

      <aside className="w-64 bg-white border-r">

        <div className="p-6 font-bold text-xl">
          Sandik
        </div>

        <nav className="space-y-2 px-4">

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className="flex items-center gap-2 p-3 w-full hover:bg-slate-100 rounded"
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}

        </nav>

        <div className="p-4 mt-6">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-red-500"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </aside>

      <main className="flex-1 p-8">
        {renderPage()}
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          <Route path="/" element={<Landing />} />

          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}
