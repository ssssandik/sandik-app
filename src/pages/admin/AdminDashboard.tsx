import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Hash, 
  Plus, 
  X, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Search,
  LayoutDashboard,
  Users,
  Building
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Apartment, Building as BuildingType } from '../../types';
import { useAuth } from '../../auth/AuthProvider';

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [building, setBuilding] = useState<BuildingType | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    number: '',
    floor: ''
  });

  const fetchBuildingAndApartments = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch building owned by the current user
    const { data: bld, error: bldError } = await supabase
      .from('buildings')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (bldError) {
      console.error('Error fetching building:', bldError);
      setLoading(false);
      return;
    }

    if (bld) {
      setBuilding(bld);
      // Fetch apartments for this building
      const { data: apts, error: aptsError } = await supabase
        .from('apartments')
        .select('*')
        .eq('building_id', bld.id)
        .order('number', { ascending: true });

      if (aptsError) {
        console.error('Error fetching apartments:', aptsError);
      } else {
        setApartments(apts || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBuildingAndApartments();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('admin-apartments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'apartments' },
        () => {
          console.log('Apartment change detected, refreshing...');
          fetchBuildingAndApartments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCreateApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building || !formData.number || !formData.floor) {
      alert('Please fill in all fields');
      return;
    }

    setIsSaving(true);
    try {
      const invite_code = generateInviteCode();
      
      // Check for duplicate invite code (unlikely but good practice)
      const { data: existing } = await supabase
        .from('apartments')
        .select('id')
        .eq('invite_code', invite_code)
        .maybeSingle();
      
      if (existing) {
        // Retry once if code exists
        return handleCreateApartment(e);
      }

      const { data, error } = await supabase
        .from('apartments')
        .insert([{
          building_id: building.id,
          number: formData.number,
          floor: formData.floor,
          invite_code: invite_code,
          is_occupied: false
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setApartments([...apartments, data]);
        setIsModalOpen(false);
        setFormData({ number: '', floor: '' });
        alert('Apartment created successfully!');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const filteredApartments = apartments.filter(apt => 
    apt.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.floor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.invite_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl border border-slate-200 p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl">
            <Building2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">No Building Found</h2>
          <p className="text-slate-500">You need to create a building before you can manage apartments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-indigo-500" />
              Admin Dashboard
            </h1>
            <p className="text-slate-500 font-medium mt-1">Managing {building.building_name || building.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search apartments..." 
                className="ps-11 pe-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-full md:w-64 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              <Plus size={18} />
              Add Apartment
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Building size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Units</p>
                <p className="text-2xl font-black text-slate-900">{apartments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Occupied</p>
                <p className="text-2xl font-black text-slate-900">{apartments.filter(a => a.is_occupied).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <XCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Available</p>
                <p className="text-2xl font-black text-slate-900">{apartments.filter(a => !a.is_occupied).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Apartments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApartments.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Hash size={32} />
              </div>
              <p className="text-slate-500 font-bold">No apartments found matching your search.</p>
            </div>
          ) : (
            filteredApartments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all p-6 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                      {apt.number}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Apartment {apt.number}</h3>
                      <p className="text-sm font-bold text-slate-400">Floor {apt.floor || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                    apt.is_occupied ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${apt.is_occupied ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {apt.is_occupied ? 'Occupied' : 'Available'}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invite Code</span>
                    <span className="text-sm font-black text-indigo-600 font-mono tracking-wider">{apt.invite_code}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(apt.invite_code, 'Invite code')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <Copy size={14} />
                      Copy Code
                    </button>
                    <button 
                      onClick={() => copyToClipboard(`https://sandik.app/join?code=${apt.invite_code}`, 'Invite link')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink size={14} />
                      Copy Link
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <Users size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {apt.is_occupied ? 'Assigned to User' : 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Apartment Modal */}
        <div>
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                onClick={() => setIsModalOpen(false)} 
              />
              <div 
                className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight">Add New Apartment</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateApartment}>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apartment Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 101"
                        required
                        value={formData.number}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Floor</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1"
                        required
                        value={formData.floor}
                        onChange={(e) => setFormData({...formData, floor: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                      />
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus size={22} />
                      )}
                      {isSaving ? 'Creating...' : 'Create Apartment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
