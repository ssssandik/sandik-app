import React, { useState, useEffect } from 'react';
import { Search, Edit2, Phone, User, Hash, Plus, X, CheckCircle2, XCircle, Wallet, DollarSign, Calendar } from 'lucide-react';
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

  const [lastPayments, setLastPayments] = useState<Record<string, Payment>>({});
  const [amountsDue, setAmountsDue] = useState<Record<string, number>>({});

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
      
      // Fetch all payments for these apartments to calculate due and last payment
      const { data: allPayments } = await supabase
        .from('payments')
        .select('*')
        .in('apartment_id', aptIds)
        .order('payment_date', { ascending: false });

      const statusMap: Record<string, string> = {};
      const lastPayMap: Record<string, Payment> = {};
      const dueMap: Record<string, number> = {};

      apts.forEach(apt => {
        const aptPayments = allPayments?.filter(p => p.apartment_id === apt.id) || [];
        
        // Status this month
        const thisMonthPayment = aptPayments.find(p => p.month === currentMonth && p.year === currentYear);
        statusMap[apt.id] = thisMonthPayment?.payment_status || 'unpaid';

        // Last payment
        if (aptPayments.length > 0) {
          lastPayMap[apt.id] = aptPayments[0];
        }

        // Amount due (simplified: count months from building creation or a fixed start)
        // For now, let's just count unpaid months in the current year up to now
        let unpaidCount = 0;
        for (let m = 1; m <= currentMonth; m++) {
          const hasPaid = aptPayments.some(p => p.month === m && p.year === currentYear && p.payment_status === 'paid');
          if (!hasPaid) unpaidCount++;
        }
        dueMap[apt.id] = unpaidCount * building.monthly_contribution;
      });

      setPaymentStatuses(statusMap);
      setLastPayments(lastPayMap);
      setAmountsDue(dueMap);
    }
    setLoading(false);
  };

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: building?.monthly_contribution || 0,
    date: new Date().toISOString().split('T')[0]
  });

  const handleQuickPayClick = (apt: Apartment) => {
    setSelectedApt(apt);
    setPaymentData({
      amount: building?.monthly_contribution || 0,
      date: new Date().toISOString().split('T')[0]
    });
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!building || !selectedApt) return;
    setIsSaving(true);
    try {
      const { data: newPayment, error } = await supabase
        .from('payments')
        .insert([{
          apartment_id: selectedApt.id,
          building_id: building.id,
          month: currentMonth,
          year: currentYear,
          amount: paymentData.amount,
          payment_status: 'paid',
          payment_date: paymentData.date
        }])
        .select()
        .single();

      if (error) throw error;
      
      if (newPayment) {
        auditService.logCreate('payment', newPayment.id, building.id, { ...newPayment, apartment_number: selectedApt.apartment_number });
      }
      
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [building]);

  const handleSave = async () => {
    if (!building) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('apartments')
        .insert([{ ...formData, building_id: building.id }])
        .select()
        .single();
      
      if (error) throw error;
      if (data) {
        auditService.logCreate('apartment', data.id, building.id, data);
        setIsModalOpen(false);
        setFormData({ apartment_number: '', owner_name: '', phone: '' });
        fetchData();
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredApartments = apartments.filter(apt => 
    apt.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.apartment_number.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider border border-emerald-100"><CheckCircle2 size={12} /> Paid</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider border border-rose-100"><XCircle size={12} /> Unpaid</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Apartments</h2>
          <p className="text-slate-500 font-medium">Manage all units in {building?.building_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by owner or apt..." 
              className="ps-11 pe-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-full md:w-72 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Add Apartment
          </button>
        </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            <div 
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-xl text-slate-900">Add New Apartment</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Apartment Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 101"
                    value={formData.apartment_number}
                    onChange={(e) => setFormData({...formData, apartment_number: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Owner Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ahmed Alami"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 0612345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}
                  {isSaving ? 'Saving...' : 'Save Apartment'}
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Apt #</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount Due</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Last Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading apartments...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredApartments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No apartments found.</td>
                </tr>
              ) : (
                filteredApartments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                        {apt.apartment_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{apt.owner_name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Owner</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
                        <Phone size={14} className="text-slate-300" />
                        {apt.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(paymentStatuses[apt.id])}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${amountsDue[apt.id] > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {amountsDue[apt.id]} MAD
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lastPayments[apt.id] ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">
                            {new Date(lastPayments[apt.id].payment_date!).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            {lastPayments[apt.id].amount} MAD
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No payments</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {paymentStatuses[apt.id] !== 'paid' && (
                          <button 
                            onClick={() => handleQuickPayClick(apt)}
                            title="Quick Pay"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Wallet size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => onEdit?.(apt.id)}
                          title="Edit Apartment"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <div
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Quick Payment</h3>
                    <p className="text-xs font-medium text-slate-500">Apt {selectedApt?.apartment_number} • {new Date().toLocaleString('default', { month: 'long' })}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Amount (MAD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Payment Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="date"
                      value={paymentData.date}
                      onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  {isSaving ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
