import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Apartments from './components/Apartments';
import Contributions from './components/Contributions';
import Reports from './components/Reports';
import Settings from './components/Settings';
import AuditLogs from './pages/AuditLogs';
import { supabase } from './lib/supabase';
import { Building } from './types';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import Login from './auth/Login';
import Register from './auth/Register';
import { auditService } from './services/auditService';

type Page = 'dashboard' | 'apartments' | 'contributions' | 'reports' | 'settings' | 'audit';

function MainApp() {
  const { signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingApartmentId, setEditingApartmentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBuildingForm, setNewBuildingForm] = useState({
    name: '',
    address: '',
    total_units: 10,
    monthly_fee: 100
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchBuilding() {
      const { data } = await supabase
        .from('buildings')
        .select('*')
        .limit(1)
        .single();
      
      if (data) setBuilding(data);
      setLoading(false);
    }
    fetchBuilding();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'apartments', label: 'Apartments', icon: Building2 },
    { id: 'contributions', label: 'Contributions', icon: TableProperties },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto shadow-lg shadow-emerald-100">S</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome to Sandik</h1>
            <p className="text-slate-500 mt-2">Let's get started by setting up your first building.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
          >
            <Building2 size={20} />
            Create First Building
          </button>
          <button 
            onClick={() => signOut()}
            className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            Sign Out
          </button>
        </div>

        {/* Create Building Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                onClick={() => setIsCreateModalOpen(false)} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-xl text-slate-900">Setup Your Building</h3>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Building Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Residence Al Amal"
                      value={newBuildingForm.name}
                      onChange={(e) => setNewBuildingForm({...newBuildingForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123 Boulevard Hassan II"
                      value={newBuildingForm.address}
                      onChange={(e) => setNewBuildingForm({...newBuildingForm, address: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units</label>
                      <input 
                        type="number" 
                        value={newBuildingForm.total_units}
                        onChange={(e) => setNewBuildingForm({...newBuildingForm, total_units: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Fee (MAD)</label>
                      <input 
                        type="number" 
                        value={newBuildingForm.monthly_fee}
                        onChange={(e) => setNewBuildingForm({...newBuildingForm, monthly_fee: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                  <button 
                    onClick={async () => {
                      if (!newBuildingForm.name || !newBuildingForm.address) {
                        alert('Please fill in all fields');
                        return;
                      }
                      setIsSaving(true);
                      const { data, error } = await supabase
                        .from('buildings')
                        .insert([{ 
                          building_name: newBuildingForm.name, 
                          building_address: newBuildingForm.address,
                          total_apartments: newBuildingForm.total_units,
                          monthly_contribution: newBuildingForm.monthly_fee
                        }])
                        .select()
                        .single();
                      
                      setIsSaving(false);
                      if (data) {
                        setBuilding(data);
                        setIsCreateModalOpen(false);
                        // Log building creation
                        auditService.logCreate('building', data.id, data.id, data);
                      }
                      if (error) alert(error.message);
                    }}
                    disabled={isSaving}
                    className={`w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Building2 size={20} />
                    )}
                    {isSaving ? 'Saving...' : 'Save Building'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return (
        <Dashboard 
          building={building} 
          onAddPayment={() => setCurrentPage('contributions')}
          onViewApartments={() => setCurrentPage('apartments')}
        />
      );
      case 'apartments': return (
        <Apartments 
          building={building} 
          onEdit={(id) => {
            setEditingApartmentId(id);
            setCurrentPage('settings');
          }} 
        />
      );
      case 'contributions': return <Contributions building={building} />;
      case 'reports': return <Reports building={building} />;
      case 'audit': return <AuditLogs building={building} />;
      case 'settings': return (
        <Settings 
          building={building} 
          onUpdate={setBuilding} 
          initialApartmentId={editingApartmentId}
          onClearInitialApartment={() => setEditingApartmentId(null)}
        />
      );
      default: return (
        <Dashboard 
          building={building} 
          onAddPayment={() => setCurrentPage('contributions')}
          onViewApartments={() => setCurrentPage('apartments')}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-bold text-xl tracking-tight">Sandik</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">S</div>
            <div>
              <h1 className="font-bold text-xl tracking-tight leading-none">Sandik</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">Syndic Manager</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${currentPage === item.id 
                    ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Building</p>
              <p className="text-sm font-bold text-slate-900 truncate">{building?.building_name || 'No Building Set'}</p>
            </div>
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
