import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Building2, 
  User as UserIcon, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Search
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/building', label: 'My Building', icon: Building2 },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-100">S</div>
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
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-slate-200">S</div>
            <div>
              <h1 className="font-black text-2xl tracking-tight leading-none text-slate-900">Sandik</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1.5 font-black">User Portal</p>
            </div>
          </div>

          <div className="px-6 mb-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 group
                    ${isActive 
                      ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3.5">
                    <item.icon size={20} className={isActive ? 'text-indigo-400' : 'group-hover:text-indigo-500 transition-colors'} />
                    {item.label}
                  </div>
                  {isActive && <ChevronRight size={14} className="text-slate-500" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200">
                <UserIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{profile?.first_name || profile?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">{profile?.email}</p>
              </div>
              <button 
                onClick={handleSignOut}
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
          {children}
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
