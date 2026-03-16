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
  History,
  User as UserIcon,
  ChevronRight,
  Bell,
  Search
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
import Landing from './pages/Landing';
import CreateBuilding from './pages/CreateBuilding';
import JoinBuilding from './pages/JoinBuilding';
import { auditService } from './services/auditService';

type Page = 'dashboard' | 'apartments' | 'contributions' | 'reports' | 'settings' | 'audit';

function MainApp() {
  const { signOut, user } = useAuth();
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
      if (!user) return;
      
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (data) setBuilding(data);
      setLoading(false);
    }
    fetchBuilding();
  }, [user]);

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
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[40px] shadow-2xl border border-slate-200 p-10 text-center space-y-8"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center text-white font-black text-5xl mx-auto shadow-2xl shadow-emerald-200 rotate-3 hover:rotate-0 transition-transform duration-500">S</div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome to Sandik</h1>
            <p className="text-slate-500 mt-3 font-medium leading-relaxed">The modern way to manage your building and monthly contributions. Let's start by setting up your first property.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Building2 size={22} />
            Create First Building
          </button>
          <button 
            onClick={() => signOut()}
            className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors"
          >
            Sign Out
          </button>
        </motion.div>

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
                className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight">Setup Your Building</h3>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Building Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Residence Al Amal"
                      value={newBuildingForm.name}
                      onChange={(e) => setNewBuildingForm({...newBuildingForm, name: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-slate-700 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123 Boulevard Hassan II"
                      value={newBuildingForm.address}
                      onChange={(e) => setNewBuildingForm({...newBuildingForm, address: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-slate-700 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Units</label>
                      <input 
                        type="number" 
                        value={newBuildingForm.total_units}
                        onChange={(e) => setNewBuildingForm({...newBuildingForm, total_units: Number(e.target.value)})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-slate-700 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Fee (MAD)</label>
                      <input 
                        type="number" 
                        value={newBuildingForm.monthly_fee}
                        onChange={(e) => setNewBuildingForm({...newBuildingForm, monthly_fee: Number(e.target.value)})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-slate-700 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100">
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
                          monthly_contribution: newBuildingForm.monthly_fee,
                          owner_id: user?.id
                        }])
                        .select()
                        .single();
                      
                      setIsSaving(false);
                      if (data) {
                        setBuilding(data);
                        setIsCreateModalOpen(false);
                        auditService.logCreate('building', data.id, data.id, data);
                      }
                      if (error) alert(error.message);
                    }}
                    disabled={isSaving}
                    className={`w-full py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-[0.98] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Building2 size={22} />
                    )}
                    {isSaving ? 'Setting up...' : 'Start Managing'}
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-100">S</div>
          <span className="font-black text-2xl tracking-tight text-slate-900">Sandik</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 hidden md:flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-emerald-200">S</div>
            <div>
              <h1 className="font-black text-2xl tracking-tight leading-none text-slate-900">Sandik</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1.5 font-black">Syndic Manager</p>
            </div>
          </div>

          <div className="px-6 mb-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 group
                  ${currentPage === item.id 
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <div className="flex items-center gap-3.5">
                  <item.icon size={20} className={currentPage === item.id ? 'text-emerald-400' : 'group-hover:text-emerald-500 transition-colors'} />
                  {item.label}
                </div>
                {currentPage === item.id && <ChevronRight size={14} className="text-slate-500" />}
              </button>
            ))}
          </nav>

          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 group hover:border-emerald-200 transition-all cursor-default">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Building</p>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <p className="text-sm font-black text-slate-900 truncate leading-tight">{building?.building_name || 'No Building Set'}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 truncate">{building?.building_address}</p>
            </div>

            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200">
                <UserIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">{user?.email}</p>
              </div>
              <button 
                onClick={() => signOut()}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
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
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/create-building" element={
            <ProtectedRoute>
              <CreateBuilding />
            </ProtectedRoute>
          } />
          <Route path="/join-building" element={
            <ProtectedRoute>
              <JoinBuilding />
            </ProtectedRoute>
          } />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
