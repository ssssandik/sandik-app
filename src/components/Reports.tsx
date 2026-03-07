import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, AlertCircle, Calendar, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, Apartment, Payment } from '../types';

interface ReportsProps {
  building: Building | null;
}

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
  'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'
];

export default function Reports({ building }: ReportsProps) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      if (!building) return;
      setLoading(true);

      const { data: apts } = await supabase
        .from('apartments')
        .select('*')
        .eq('building_id', building.id);

      if (apts) {
        setApartments(apts);
        const aptIds = apts.map(a => a.id);
        const { data: pays } = await supabase
          .from('payments')
          .select('*')
          .in('apartment_id', aptIds)
          .eq('year', selectedYear);
        if (pays) setPayments(pays);
      }
      setLoading(false);
    }
    fetchData();
  }, [building, selectedYear]);

  const currentMonth = new Date().getMonth() + 1;
  const monthlyCollected = payments
    .filter(p => p.month === currentMonth && p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const yearlyCollected = payments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const paidAptsCount = new Set(payments.filter(p => p.month === currentMonth && p.payment_status === 'paid').map(p => p.apartment_id)).size;
  const unpaidAptsCount = apartments.length - paidAptsCount;

  const yearlyReport = [2024, 2025, 2026].map(year => {
    const yearPayments = payments.filter(p => p.year === year && p.payment_status === 'paid');
    const collected = yearPayments.reduce((sum, p) => sum + p.amount, 0);
    const unpaidCount = apartments.length * 12 - yearPayments.length; // Simplified
    return {
      year,
      collected,
      paymentsCount: yearPayments.length,
      unpaidCount
    };
  });

  const monthlyReport = MONTHS.map((name, i) => {
    const month = i + 1;
    const monthPayments = payments.filter(p => p.month === month);
    const collected = monthPayments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const paidCount = new Set(monthPayments.filter(p => p.payment_status === 'paid').map(p => p.apartment_id)).size;
    
    return {
      name,
      collected,
      paidCount,
      unpaidCount: apartments.length - paidCount
    };
  });

  const sortedApartments = [...apartments].sort((a, b) => {
    const numA = parseInt(String(a.apartment_number));
    const numB = parseInt(String(b.apartment_number));
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a.apartment_number).localeCompare(String(b.apartment_number));
  });

  const unpaidList = sortedApartments.flatMap(apt => {
    const aptPayments = payments.filter(p => p.apartment_id === apt.id);
    const unpaidMonths = [];
    
    // Check up to current month if current year, or all 12 if past year
    const limit = selectedYear === new Date().getFullYear() ? currentMonth : 12;
    
    for (let m = 1; m <= limit; m++) {
      const p = aptPayments.find(pay => pay.month === m);
      if (!p || p.payment_status === 'unpaid') {
        unpaidMonths.push({
          aptNum: apt.apartment_number,
          owner: apt.owner_name,
          phone: apt.phone,
          month: MONTHS[m - 1],
          amount: building?.monthly_contribution || 0
        });
      }
    }
    return unpaidMonths;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Reports</h2>
          <p className="text-slate-500">Overview for {selectedYear}</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Collected This Month</p>
          <p className="text-2xl font-bold text-emerald-600">{monthlyCollected.toLocaleString()} MAD</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Collected This Year</p>
          <p className="text-2xl font-bold text-emerald-600">{yearlyCollected.toLocaleString()} MAD</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Paid Apartments</p>
          <p className="text-2xl font-bold text-slate-900">{paidAptsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unpaid Apartments</p>
          <p className="text-2xl font-bold text-rose-600">{unpaidAptsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Yearly Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20} />
            <h3 className="font-bold text-lg text-slate-900">Yearly Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Collected</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Payments</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Unpaid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearlyReport.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.year}</td>
                    <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{row.collected.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 text-center text-slate-600">{row.paymentsCount}</td>
                    <td className="px-6 py-4 text-center text-rose-500 font-bold">{row.unpaidCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="text-emerald-500" size={20} />
            <h3 className="font-bold text-lg text-slate-900">Monthly Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Paid</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Unpaid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyReport.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.name}</td>
                    <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{row.collected.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 text-center text-slate-600">{row.paidCount}</td>
                    <td className="px-6 py-4 text-center text-rose-500 font-bold">{row.unpaidCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unpaid List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle className="text-rose-500" size={20} />
            <h3 className="font-bold text-lg text-slate-900">Unpaid Apartments</h3>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Apt #</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No unpaid contributions! 🎉</td>
                  </tr>
                ) : (
                  unpaidList.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{row.aptNum}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{row.owner}</span>
                          <span className="text-xs text-slate-400">{row.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider">{row.month}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-rose-600 font-bold">{row.amount} MAD</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
