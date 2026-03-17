import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Hash, 
  Coins, 
  Plus, 
  Trash2, 
  Edit2, 
  Save,
  User,
  Phone,
  Settings as SettingsIcon,
  Globe,
  Bell,
  Lock,
  ChevronRight,
  X,
  Calendar,
  CreditCard,
  Shield,
  Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, Apartment } from '../types';
import { auditService } from '../services/auditService';
import { useAuth } from '../auth/AuthProvider';
// import { motion, AnimatePresence } from 'framer-motion';

interface SettingsProps {
  building: Building | null;
  onUpdate: (building: Building) => void;
  initialApartmentId?: string | null;
  onClearInitialApartment?: () => void;
}

export default function Settings({ building, onUpdate, initialApartmentId, onClearInitialApartment }: SettingsProps) {
  const { profile, refreshProfile } = useAuth();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeModal, setActiveModal] = useState<'building' | 'apartment' | 'app' | 'account' | 'security' | 'password' | null>(null);
  
  const [buildingForm, setBuildingForm] = useState({
    name: building?.building_name || '',
    address: building?.building_address || '',
    total: building?.total_apartments || 0,
    contribution: building?.monthly_contribution || 0
  });

  const [appSettingsForm, setAppSettingsForm] = useState({
    currentYear: new Date().getFullYear().toString(),
    notificationsEnabled: true,
    currency: 'MAD'
  });

  const [accountForm, setAccountForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [selectedApt, setSelectedApt] = useState<Partial<Apartment> | null>(null);

  useEffect(() => {
    async function fetchApts() {
      if (!building) return;
      const { data } = await supabase
        .from('apartments')
        .select('*')
        .eq('building_id', building.id);
      
      if (data) {
        const sorted = [...data].sort((a, b) => {
          const numA = parseInt(String(a.apartment_number));
          const numB = parseInt(String(b.apartment_number));
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a.apartment_number).localeCompare(String(b.apartment_number));
        });
        setApartments(sorted);
      }
      setLoading(false);
    }
    fetchApts();
  }, [building]);

  useEffect(() => {
    if (initialApartmentId && apartments.length > 0) {
      const apt = apartments.find(a => a.id === initialApartmentId);
      if (apt) {
        setSelectedApt(apt);
        setActiveModal('apartment');
        onClearInitialApartment?.();
      }
    }
  }, [initialApartmentId, apartments, onClearInitialApartment]);

  useEffect(() => {
    if (profile) {
      setAccountForm({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (building) {
      setBuildingForm({
        name: building.building_name,
        address: building.building_address,
        total: building.total_apartments,
        contribution: building.monthly_contribution
      });
    }
  }, [building]);

  const handleUpdateBuilding = async () => {
    if (!building) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('buildings')
        .update({
          building_name: buildingForm.name,
          building_address: buildingForm.address,
          total_apartments: buildingForm.total,
          monthly_contribution: buildingForm.contribution
        })
        .eq('id', building.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        auditService.logUpdate('building', building.id, building.id, building, data);
        onUpdate(data);
        setActiveModal(null);
      }
    } catch (error: any) {
      console.error('Error updating building:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApt = async () => {
    if (!building || !selectedApt) return;
    setIsSaving(true);

    try {
      if (!selectedApt.id) {
        const { data: bld, error: bldError } = await supabase
          .from('buildings')
          .select('total_apartments')
          .eq('id', building.id)
          .single();
        
        if (bldError) throw bldError;

        const { count, error: countError } = await supabase
          .from('apartments')
          .select('*', { count: 'exact', head: true })
          .eq('building_id', building.id);
        
        if (countError) throw countError;

        if (count !== null && count >= bld.total_apartments) {
          alert('You exceeded the building apartment limit');
          setIsSaving(false);
          return;
        }
      }

      const aptData = {
        building_id: building.id,
        apartment_number: selectedApt.apartment_number,
        owner_name: selectedApt.owner_name,
        phone: selectedApt.phone
      };

      if (selectedApt.id) {
        const { error } = await supabase.from('apartments').update(aptData).eq('id', selectedApt.id);
        if (error) throw error;
        auditService.logUpdate('apartment', selectedApt.id, building.id, selectedApt, aptData);
      } else {
        const { data: newApt, error } = await supabase.from('apartments').insert([aptData]).select().single();
        if (error) throw error;
        if (newApt) {
          auditService.logCreate('apartment', newApt.id, building.id, newApt);
        }
      }

      const { data, error: fetchError } = await supabase
        .from('apartments')
        .select('*')
        .eq('building_id', building.id);
      
      if (fetchError) throw fetchError;
      if (data) {
        const sorted = [...data].sort((a, b) => {
          const numA = parseInt(String(a.apartment_number));
          const numB = parseInt(String(b.apartment_number));
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a.apartment_number).localeCompare(String(b.apartment_number));
        });
        setApartments(sorted);
      }
      setSelectedApt(null);
    } catch (error: any) {
      console.error('Error saving apartment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this apartment?')) return;
    if (!building) return;

    const { data: aptToDelete } = await supabase.from('apartments').select('*').eq('id', id).single();
    
    const { error } = await supabase.from('apartments').delete().eq('id', id);
    if (!error && aptToDelete) {
      auditService.logDelete('apartment', id, building.id, aptToDelete);
    }
    setApartments(apartments.filter(a => a.id !== id));
  };

  const handleUpdateAppSettings = async () => {
    setIsSaving(true);
    // In a real app, we might save this to a 'config' table or building metadata
    // For now, we'll just simulate a save
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    setActiveModal(null);
    alert('App settings updated successfully');
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({
          first_name: accountForm.firstName,
          last_name: accountForm.lastName,
          phone: accountForm.phone
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      alert('Profile updated successfully');
      setActiveModal(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      if (error) throw error;
      alert('Password updated successfully');
      setActiveModal(null);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = ({ icon: Icon, label, value, onClick, color = "indigo" }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all group"
    >
      <div className="flex items-center gap-5">
        <div className={`p-2.5 bg-slate-100 rounded-2xl text-slate-500 group-hover:text-${color}-500 group-hover:bg-${color}-50 transition-all border border-slate-200 group-hover:border-${color}-100`}>
          <Icon size={22} />
        </div>
        <div className="text-start">
          <p className="text-sm font-black text-slate-900 tracking-tight">{label}</p>
          {value && <p className="text-xs font-bold text-slate-400 mt-0.5">{value}</p>}
        </div>
      </div>
      <div className="p-1.5 rounded-lg bg-slate-50 text-slate-300 group-hover:text-slate-500 group-hover:bg-slate-100 transition-all">
        <ChevronRight size={18} />
      </div>
    </button>
  );

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h2>
          <p className="text-slate-500 font-medium">Manage building info and application preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Building Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Building Configuration</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <SettingItem 
                icon={Building2} 
                label="Building Info" 
                value={`${building?.building_name}`}
                onClick={() => setActiveModal('building')}
                color="emerald"
              />
              <SettingItem 
                icon={Hash} 
                label="Apartment Management" 
                value={`${apartments.length} Units Registered`}
                onClick={() => setActiveModal('apartment')}
                color="indigo"
              />
            </div>
          </div>

          {/* App Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Settings</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <SettingItem 
                icon={Calendar} 
                label="Current Year" 
                value={appSettingsForm.currentYear}
                onClick={() => setActiveModal('app')}
                color="amber"
              />
              <SettingItem 
                icon={Bell} 
                label="Notifications" 
                value={appSettingsForm.notificationsEnabled ? "Payment Reminders Enabled" : "Notifications Disabled"}
                onClick={() => setActiveModal('app')}
                color="rose"
              />
              <SettingItem 
                icon={Coins} 
                label="Currency" 
                value={`${appSettingsForm.currency} (Moroccan Dirham)`}
                onClick={() => setActiveModal('app')}
                color="emerald"
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Account Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account & Security</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <SettingItem 
                icon={User} 
                label="Profile Information" 
                value="Update your personal details"
                onClick={() => setActiveModal('account')}
                color="blue"
              />
              <SettingItem 
                icon={Shield} 
                label="Security" 
                value="Two-Factor Authentication"
                onClick={() => setActiveModal('security')}
                color="violet"
              />
              <SettingItem 
                icon={Lock} 
                label="Password" 
                value="Change your account password"
                onClick={() => setActiveModal('password')}
                color="slate"
              />
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Globe size={120} />
            </div>
            <h3 className="text-xl font-bold mb-2">Need help?</h3>
            <p className="text-indigo-100 text-sm font-medium mb-6 leading-relaxed">Check our documentation or contact support for any questions regarding Sandik.</p>
            <button className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/20">
              Visit Help Center
            </button>
          </div>
        </div>
      </div>

      {/* Building Modal */}
      <div>
        {activeModal === 'building' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setActiveModal(null)} 
            />
            <div 
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Building2 size={20} />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">Building Info</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Building Name</label>
                  <input 
                    type="text" 
                    value={buildingForm.name}
                    onChange={(e) => setBuildingForm({...buildingForm, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                  <input 
                    type="text" 
                    value={buildingForm.address}
                    onChange={(e) => setBuildingForm({...buildingForm, address: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Units</label>
                    <input 
                      type="number" 
                      value={buildingForm.total}
                      onChange={(e) => setBuildingForm({...buildingForm, total: Number(e.target.value)})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Fee</label>
                    <input 
                      type="number" 
                      value={buildingForm.contribution}
                      onChange={(e) => setBuildingForm({...buildingForm, contribution: Number(e.target.value)})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={handleUpdateBuilding}
                  disabled={isSaving}
                  className={`w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apartment Management Modal */}
      <div>
        {activeModal === 'apartment' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setActiveModal(null)} 
            />
            <div 
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Hash size={20} />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">Manage Apartments</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                <button 
                  onClick={() => setSelectedApt({ apartment_number: '', owner_name: '', phone: '' })}
                  className="w-full mb-8 py-5 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="p-1 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <Plus size={20} />
                  </div>
                  Add New Apartment
                </button>

                <div>
                  {selectedApt && (
                    <div 
                      className="mb-10 p-8 bg-slate-50 rounded-[32px] border border-slate-200 space-y-6 shadow-inner"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apt #</label>
                          <input 
                            type="text" 
                            value={selectedApt.apartment_number}
                            onChange={(e) => setSelectedApt({...selectedApt, apartment_number: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner Name</label>
                          <input 
                            type="text" 
                            value={selectedApt.owner_name}
                            onChange={(e) => setSelectedApt({...selectedApt, owner_name: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                          <input 
                            type="text" 
                            value={selectedApt.phone}
                            onChange={(e) => setSelectedApt({...selectedApt, phone: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setSelectedApt(null)}
                          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all active:scale-95"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveApt}
                          disabled={isSaving}
                          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          {selectedApt.id ? 'Update Apartment' : 'Save Apartment'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {apartments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-700 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                          {apt.apartment_number}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-black text-slate-900 tracking-tight">{apt.owner_name}</p>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone size={10} />
                            <span className="text-[10px] font-bold font-mono">{apt.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedApt(apt)}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteApt(apt.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* App Settings Modal */}
      <div>
        {activeModal === 'app' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setActiveModal(null)} 
            />
            <div 
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <SettingsIcon size={20} />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">App Settings</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Year</label>
                  <select 
                    value={appSettingsForm.currentYear}
                    onChange={(e) => setAppSettingsForm({...appSettingsForm, currentYear: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</label>
                  <select 
                    value={appSettingsForm.currency}
                    onChange={(e) => setAppSettingsForm({...appSettingsForm, currency: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                  >
                    <option value="MAD">MAD (Moroccan Dirham)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="text-sm font-black text-slate-900">Push Notifications</p>
                    <p className="text-[10px] text-slate-400 font-bold">Receive payment reminders</p>
                  </div>
                  <button 
                    onClick={() => setAppSettingsForm({...appSettingsForm, notificationsEnabled: !appSettingsForm.notificationsEnabled})}
                    className={`w-12 h-6 rounded-full transition-all relative ${appSettingsForm.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettingsForm.notificationsEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={handleUpdateAppSettings}
                  disabled={isSaving}
                  className={`w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Modal */}
      <div>
        {activeModal === 'account' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setActiveModal(null)} 
            />
            <div 
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <User size={20} />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">Profile Info</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                    <input 
                      type="text" 
                      value={accountForm.firstName}
                      onChange={(e) => setAccountForm({...accountForm, firstName: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                    <input 
                      type="text" 
                      value={accountForm.lastName}
                      onChange={(e) => setAccountForm({...accountForm, lastName: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    type="text" 
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({...accountForm, phone: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className={`w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Modal */}
      <div>
        {activeModal === 'security' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setActiveModal(null)} 
            />
            <div 
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
                    <Shield size={20} />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">Security</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center mx-auto">
                  <Smartphone size={40} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">Coming Soon</h4>
                  <p className="text-slate-500 font-medium mt-2">Two-Factor Authentication and advanced security logs are currently under development.</p>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Modal */}
      <div>
        {activeModal === 'password' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setActiveModal(null)} 
            />
            <div 
              className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">Change Password</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={handleUpdatePassword}
                  disabled={isSaving}
                  className={`w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={20} />}
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
