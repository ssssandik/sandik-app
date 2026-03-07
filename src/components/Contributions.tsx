import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Save, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, Apartment, Payment, PaymentStatus } from '../types';
import { auditService } from '../services/auditService';

interface ContributionsProps {
  building: Building | null;
}

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
  'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'
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

    // Subscribe to realtime changes in payments table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          console.log('Realtime change detected, refreshing payments...');
          fetchData(false); // Refresh without showing global loader
        }
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
    if (!selectedCell) {
      console.error('No cell selected for payment');
      return;
    }
    
    setIsSaving(true);
    console.log('Starting handleSavePayment...', { selectedCell, modalData });

    try {
      const paymentData = {
        amount: modalData.amount,
        payment_status: modalData.status,
        payment_date: modalData.date
      };

      let result;
      if (modalData.id) {
        console.log('Updating existing payment:', modalData.id);
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
        console.log('Inserting new payment');
        result = await supabase
          .from('payments')
          .insert([{
            ...paymentData,
            apartment_id: selectedCell.apt.id,
            month: selectedCell.month,
            year: selectedYear
          }])
          .select()
          .single();
        
        if (result.data && building) {
          auditService.logCreate('payment', result.data.id, building.id, result.data);
        }
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      console.log('Payment saved successfully');
      alert('Payment saved successfully');

      // Refresh data using the centralized function
      await fetchData(false);
      
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Caught error in handleSavePayment:', error);
      alert('Error saving payment: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!modalData.id || !building) return;

    // Fetch payment first for logging
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monthly Contributions</h2>
          <p className="text-slate-500">Traditional syndic board view for {selectedYear}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
          <button 
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-bold text-slate-900">{selectedYear}</span>
          <button 
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky start-0 z-10 bg-slate-50 px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-e border-slate-200">Apt #</th>
                {MONTHS.map((month, i) => (
                  <th key={month} className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center border-e border-slate-100 last:border-e-0">
                    {month.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-slate-400">Loading board...</td>
                </tr>
              ) : (
                apartments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="sticky start-0 z-10 bg-white px-6 py-4 font-bold text-slate-900 border-e border-slate-200">
                      {apt.apartment_number}
                    </td>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const month = i + 1;
                      const payment = getPaymentForCell(apt.id, month);
                      let bgColor = 'bg-white';
                      let dotColor = 'bg-slate-200';
                      
                     const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

if (payment) {
  if (payment.payment_status === 'paid') {
    bgColor = 'bg-emerald-50';
    dotColor = 'bg-emerald-500';
  } 
  else if (payment.payment_status === 'late') {
    bgColor = 'bg-amber-50';
    dotColor = 'bg-amber-500';
  } 
  else if (payment.payment_status === 'unpaid') {
    bgColor = 'bg-rose-50';
    dotColor = 'bg-rose-500';
  }
} 
else {
  // Only mark as late if NO payment exists
  if (
    selectedYear < currentYear ||
    (selectedYear === currentYear && month <= currentMonth)
  ) {
    bgColor = 'bg-rose-50';
    dotColor = 'bg-rose-500';
  }
}
                      return (
                        <td 
                          key={i} 
                          onClick={() => handleCellClick(apt, month)}
                          className={`p-1 border-e border-slate-100 last:border-e-0 cursor-pointer transition-all hover:opacity-80`}
                        >
                          <div className={`h-12 w-full rounded-lg ${bgColor} flex items-center justify-center`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-sm`} />
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

      {/* Payment Modal */}
      {isModalOpen && selectedCell && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-xl text-slate-900">Payment Details</h3>
                <p className="text-sm text-slate-500">Apt {selectedCell.apt.apartment_number} • {MONTHS[selectedCell.month - 1]} {selectedYear}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Owner</label>
                  <p className="font-semibold text-slate-900">{selectedCell.apt.owner_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                  <p className="font-semibold text-slate-900">{selectedCell.apt.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount (MAD)</label>
                <input 
                  type="number" 
                  value={modalData.amount}
                  onChange={(e) => setModalData({ ...modalData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Date</label>
                <input 
                  type="date" 
                  value={modalData.date}
                  onChange={(e) => setModalData({ ...modalData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['paid', 'unpaid', 'late'] as PaymentStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setModalData({ ...modalData, status: s })}
                      className={`
                        py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all
                        ${modalData.status === s 
                          ? (s === 'paid' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100' : 
                             s === 'late' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100' : 
                             'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100')
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
                  className="px-4 py-3 bg-white border border-rose-200 text-rose-500 rounded-xl font-bold hover:bg-rose-50 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button 
                onClick={handleSavePayment}
                disabled={isSaving}
                className={`flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
