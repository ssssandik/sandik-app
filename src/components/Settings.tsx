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
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, Apartment } from '../types';
import { auditService } from '../services/auditService';

interface SettingsProps {
  building: Building | null;
  onUpdate: (building: Building) => void;
  initialApartmentId?: string | null;
  onClearInitialApartment?: () => void;
}

export default function Settings({ building, onUpdate, initialApartmentId, onClearInitialApartment }: SettingsProps) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeModal, setActiveModal] = useState<'building' | 'apartment' | 'app' | 'account' | null>(null);
  
  const [buildingForm, setBuildingForm] = useState({
    name: building?.building_name || '',
    address: building?.building_address || '',
    total: building?.total_apartments || 0,
    contribution: building?.monthly_contribution || 0
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
        // Log building update
        auditService.logUpdate('building', building.id, building.id, building, data);
        onUpdate(data);
        setActiveModal(null);
      }
    } catch (error: any) {
      console.error('Error updating building:', error);
      alert('Error updating building: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApt = async () => {
    if (!building || !selectedApt) return;
    setIsSaving(true);

    try {
      if (!selectedApt.id) {
        // 1. Fetch the building total_apartments from the buildings table to ensure we have the latest data
        const { data: bld, error: bldError } = await supabase
          .from('buildings')
          .select('total_apartments')
          .eq('id', building.id)
          .single();
        
        if (bldError) throw bldError;

        // 2. Count the current apartments in the apartments table for this building
        const { count, error: countError } = await supabase
          .from('apartments')
          .select('*', { count: 'exact', head: true })
          .eq('building_id', building.id);
        
        if (countError) throw countError;

        // 3. If current_apartments >= total_apartments, show error and return
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
        // Log apartment update
        auditService.logUpdate('apartment', selectedApt.id, building.id, selectedApt, aptData);
      } else {
        const { data: newApt, error } = await supabase.from('apartments').insert([aptData]).select().single();
        if (error) throw error;
        // Log apartment creation
        if (newApt) {
          auditService.logCreate('apartment', newApt.id, building.id, newApt);
        }
      }

      // Refresh
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
      setActiveModal(null);
      setSelectedApt(null);
    } catch (error: any) {
      console.error('Error saving apartment:', error);
      alert('Error saving apartment: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this apartment?')) return;
    if (!building) return;

    // Fetch apt first for logging
    const { data: aptToDelete } = await supabase.from('apartments').select('*').eq('id', id).single();
    
    const { error } = await supabase.from('apartments').delete().eq('id', id);
    if (!error && aptToDelete) {
      auditService.logDelete('apartment', id, building.id, aptToDelete);
    }
    setApartments(apartments.filter(a => a.id !== id));
  };

  const SettingItem = ({ icon: Icon, label, value, onClick }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-slate-100 rounded-xl text-slate-500 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
          <Icon size={20} />
        </div>
        <div className="text-start">
          <p className="text-sm font-bold text-slate-900">{label}</p>
          {value && <p className="text-xs text-slate-400">{value}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500">Manage building info and application preferences</p>
      </div>

      <div className="space-y-6">
        {/* Building Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Building Configuration</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <SettingItem 
              icon={Building2} 
              label="Building Info" 
              value={`${building?.building_name} • ${building?.building_address}`}
              onClick={() => setActiveModal('building')}
            />
            <SettingItem 
              icon={Hash} 
              label="Apartment Management" 
              value={`${apartments.length} Apartments Registered`}
              onClick={() => setActiveModal('apartment')}
            />
          </div>
        </div>

        {/* App Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Application Settings</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <SettingItem 
              icon={Calendar} 
              label="Current Year" 
              value="2026"
              onClick={() => {}}
            />
            <SettingItem 
              icon={Bell} 
              label="Payment Reminders" 
              value="Enabled"
              onClick={() => {}}
            />
            <SettingItem 
              icon={Coins} 
              label="Currency" 
              value="MAD (Moroccan Dirham)"
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account & Security</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <SettingItem 
              icon={User} 
              label="Profile Information" 
              value="Syndic Manager"
              onClick={() => {}}
            />
            <SettingItem 
              icon={Lock} 
              label="Security" 
              value="Change Password"
              onClick={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Building Modal */}
      {activeModal === 'building' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-xl text-slate-900">Edit Building Info</h3>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Building Name</label>
                <input 
                  type="text" 
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({...buildingForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</label>
                <input 
                  type="text" 
                  value={buildingForm.address}
                  onChange={(e) => setBuildingForm({...buildingForm, address: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units</label>
                  <input 
                    type="number" 
                    value={buildingForm.total}
                    onChange={(e) => setBuildingForm({...buildingForm, total: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Fee (MAD)</label>
                  <input 
                    type="number" 
                    value={buildingForm.contribution}
                    onChange={(e) => setBuildingForm({...buildingForm, contribution: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
              <button 
                onClick={handleUpdateBuilding}
                disabled={isSaving}
                className={`w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apartment Management Modal */}
      {activeModal === 'apartment' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-xl text-slate-900">Manage Apartments</h3>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <button 
                onClick={() => setSelectedApt({ apartment_number: '', owner_name: '', phone: '' })}
                className="w-full mb-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add New Apartment
              </button>

              {selectedApt && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-4 duration-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apt #</label>
                      <input 
                        type="text" 
                        value={selectedApt.apartment_number}
                        onChange={(e) => setSelectedApt({...selectedApt, apartment_number: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Owner</label>
                      <input 
                        type="text" 
                        value={selectedApt.owner_name}
                        onChange={(e) => setSelectedApt({...selectedApt, owner_name: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                      <input 
                        type="text" 
                        value={selectedApt.phone}
                        onChange={(e) => setSelectedApt({...selectedApt, phone: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedApt(null)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveApt}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100"
                    >
                      Save Apartment
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {apartments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700">
                        {apt.apartment_number}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{apt.owner_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{apt.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setSelectedApt(apt)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteApt(apt.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
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
  );
}
