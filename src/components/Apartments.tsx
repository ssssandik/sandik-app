import React, { useState, useEffect } from 'react';
import { Search, Edit2, Phone, User, Hash, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Building, Apartment, Payment } from '../types';
import { auditService } from '../services/auditService';

interface ApartmentsProps {
  building: Building | null;
  onEdit?: (id: string) => void;
}

export default function Apartments({ building, onEdit }: ApartmentsProps) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    apartment_number: '',
    owner_name: '',
    phone: ''
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchData = async () => {
    if (!building) return;
    setLoading(true);

    const { data: apts } = await supabase
      .from('apartments')
      .select('*')
      .eq('building_id', building.id)
      .order('apartment_number', { ascending: true });

    if (apts) {
      const sortedApts = [...apts].sort((a, b) => {
        const numA = parseInt(String(a.apartment_number));
        const numB = parseInt(String(b.apartment_number));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.apartment_number).localeCompare(String(b.apartment_number));
      });
      setApartments(sortedApts);
      
      const aptIds = apts.map(a => a.id);
      const { data: payments } = await supabase
        .from('payments')
        .select('apartment_id, payment_status')
        .in('apartment_id', aptIds)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      const statusMap: Record<string, string> = {};
      payments?.forEach(p => {
        statusMap[p.apartment_id] = p.payment_status;
      });
      setPaymentStatuses(statusMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [building, currentMonth, currentYear]);

  const handleSave = async () => {
    if (!building) return;
    if (!formData.apartment_number || !formData.owner_name) {
      alert('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
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

      const { data: newApt, error } = await supabase
        .from('apartments')
        .insert([{
          building_id: building.id,
          apartment_number: formData.apartment_number,
          owner_name: formData.owner_name,
          phone: formData.phone
        }])
        .select()
        .single();

      if (error) throw error;
      if (newApt) {
        auditService.logCreate('apartment', newApt.id, building.id, newApt);
      }

      setFormData({ apartment_number: '', owner_name: '', phone: '' });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredApartments = apartments.filter(apt => 
    String(apt.apartment_number).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(apt.owner_name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'paid':
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">Paid</span>;
      case 'late':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">Late</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider">Unpaid</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Apartments</h2>
          <p className="text-slate-500">Manage all units in {building?.building_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus size={18} />
            Add Apartment
          </button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search apartment or owner..." 
              className="ps-10 pe-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full md:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-xl text-slate-900">Add New Apartment</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apartment Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 101"
                    value={formData.apartment_number}
                    onChange={(e) => setFormData({...formData, apartment_number: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Owner Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ahmed Alami"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 0612345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}
                  {isSaving ? 'Saving...' : 'Save Apartment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Apt #</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status (This Month)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading apartments...</td>
                </tr>
              ) : filteredApartments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No apartments found.</td>
                </tr>
              ) : (
                filteredApartments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                          {apt.apartment_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{apt.owner_name}</span>
                        <span className="text-xs text-slate-400">Owner</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
                        <Phone size={14} />
                        {apt.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(paymentStatuses[apt.id])}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <button 
                        onClick={() => onEdit?.(apt.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
