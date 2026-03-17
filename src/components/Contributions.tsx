import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Save, Trash2, X, Check, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, Apartment, Payment, PaymentStatus } from '../types';
import { auditService } from '../services/auditService';
// import { motion, AnimatePresence } from 'framer-motion';

interface ContributionsProps {
  building: Building | null;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Contributions({ building }: ContributionsProps) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ apt: Apartment; month: number } | null>(null);
  const [modalData, setModalData] = useState<{
    amount: number;
    status: PaymentStatus;
    date: string;
    id?: string;
  }>({
    amount: building?.monthly_contribution || 0,
    status: 'paid',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async (showLoading = true) => {
    if (!building) return;
    if (showLoading) setLoading(true);

    try {
      const { data: apts } = await supabase
        .from('apartments')
        .select('*')
        .eq('building_id', building.id)
        .order('apartment_number', { ascending: true });

      if (apts) {
        const sorted = [...apts].sort((a, b) => {
          const numA = parseInt(String(a.apartment_number));
          const numB = parseInt(String(b.apartment_number));
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a.apartment_number).localeCompare(String(b.apartment_number));
        });
        setApartments(sorted);

        const aptIds = sorted.map(a => a.id);
        const { data: pays } = await supabase
          .from('payments')
          .select('*')
          .in('apartment_id', aptIds)
          .eq('year', selectedYear);

        if (pays) setPayments(pays);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => fetchData(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [building, selectedYear]);

  const getPaymentForCell = (aptId: string, month: number) => {
    return payments.find(
      p => p.apartment_id === aptId && Number(p.month) === month
    );
  };

  const handleCellClick = (apt: Apartment, month: number) => {
    const existing = getPaymentForCell(apt.id, month);
    setSelectedCell({ apt, month });
    setModalData({
      amount: existing?.amount || building?.monthly_contribution || 0,
      status: existing?.payment_status || 'paid',
      date: existing?.payment_date || new Date().toISOString().split('T')[0],
      id: existing?.id
    });
    setIsModalOpen(true);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSavePayment = async () => {
    if (!selectedCell) return;
    
    setIsSaving(true);
    try {
      const paymentData = {
        amount: modalData.amount,
        payment_status: modalData.status,
        payment_date: modalData.date
      };

      let result;
      if (modalData.id) {
        result = await supabase
          .from('payments')
          .update(paymentData)
          .eq('id', modalData.id)
          .select()
          .single();
        
        if (result.data && building) {
          auditService.logUpdate('payment', modalData.id, building.id, modalData, result.data);
        }
      } else {
        result = await supabase
          .from('payments')
          .insert([{
            ...paymentData,
            apartment_id: selectedCell.apt.id,
            month: selectedCell.month,
            year: selectedYear,
            building_id: building?.id
          }])
          .select()
          .single();
        
        if (result.data && building) {
          auditService.logCreate('payment', result.data.id, building.id, { ...result.data, apartment_number: selectedCell.apt.apartment_number });
        }
      }

      if (result.error) throw result.error;

      await fetchData(false);
      setIsModalOpen(false);
    } catch (error: any) {
      alert('Error saving payment: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!modalData.id || !building) return;

    const { data: paymentToDelete } = await supabase.from('payments').select('*').eq('id', modalData.id).single();

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', modalData.id);

    if (error) {
      alert(error.message);
    } else {
      if (paymentToDelete) {
        auditService.logDelete('payment', modalData.id, building.id, paymentToDelete);
      }
      await fetchData(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Contributions Board</h2>
          <p className="text-slate-500 font-medium">Yearly overview for {selectedYear}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
          <button 
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4">
            <Calendar size={18} className="text-indigo-500" />
            <span className="font-bold text-slate-900">{selectedYear}</span>
          </div>
          <button 
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full text-start border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky start-0 z-20 bg-slate-50 px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider border-e border-slate-200">Apt #</th>
                {MONTHS.map((month, i) => (
                  <th key={month} className="px-2 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-e border-slate-100 last:border-e-0">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Loading Board...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                apartments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="sticky start-0 z-10 bg-white px-6 py-4 font-black text-slate-900 border-e border-slate-200 group-hover:bg-slate-50 transition-colors">
                      {apt.apartment_number}
                    </td>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const month = i + 1;
                      const payment = getPaymentForCell(apt.id, month);
                      const currentYear = new Date().getFullYear();
                      const currentMonth = new Date().getMonth() + 1;

                      let statusColor = 'bg-slate-100 text-slate-300';
                      let icon = null;
                      let label = 'Future';

                      if (payment) {
                        if (payment.payment_status === 'paid') {
                          statusColor = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
                          icon = <Check size={14} strokeWidth={3} />;
                          label = 'Paid';
                        } else if (payment.payment_status === 'late') {
                          statusColor = 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
                          icon = <Clock size={14} strokeWidth={3} />;
                          label = 'Late';
                        } else {
                          statusColor = 'bg-rose-500 text-white shadow-lg shadow-rose-500/20';
                          icon = <AlertCircle size={14} strokeWidth={3} />;
                          label = 'Unpaid';
                        }
                      } else if (selectedYear < currentYear || (selectedYear === currentYear && month < currentMonth)) {
                        statusColor = 'bg-rose-500 text-white shadow-lg shadow-rose-500/20';
                        icon = <AlertCircle size={14} strokeWidth={3} />;
                        label = 'Unpaid';
                      }

                      return (
                        <td 
                          key={i} 
                          onClick={() => handleCellClick(apt, month)}
                          className="p-2 border-e border-slate-100 last:border-e-0 cursor-pointer"
                        >
                          <div className={`h-16 w-full rounded-2xl flex items-center justify-center transition-all hover:scale-[1.02] hover:brightness-105 active:scale-95 ${statusColor}`}>
                            {icon}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unpaid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-100" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Future</span>
        </div>
      </div>

      <div>
        {isModalOpen && selectedCell && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            <div 
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Payment Details</h3>
                  <p className="text-sm text-slate-500 font-medium">Apt {selectedCell.apt.apartment_number} • {MONTHS[selectedCell.month - 1]} {selectedYear}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm">
                    {selectedCell.apt.apartment_number}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedCell.apt.owner_name}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedCell.apt.phone}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Amount (MAD)</label>
                  <input 
                    type="number" 
                    value={modalData.amount}
                    onChange={(e) => setModalData({ ...modalData, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Payment Date</label>
                  <input 
                    type="date" 
                    value={modalData.date}
                    onChange={(e) => setModalData({ ...modalData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['paid', 'unpaid', 'late'] as PaymentStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setModalData({ ...modalData, status: s })}
                        className={`
                          py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                          ${modalData.status === s 
                            ? (s === 'paid' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 
                               s === 'late' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 
                               'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20')
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}
                        `}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                {modalData.id && (
                  <button 
                    onClick={handleDeletePayment}
                    className="p-4 bg-white border border-rose-200 text-rose-500 rounded-2xl font-bold hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  onClick={handleSavePayment}
                  disabled={isSaving}
                  className={`flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {isSaving ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
