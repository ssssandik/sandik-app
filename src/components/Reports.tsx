import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, AlertCircle, Calendar, Download, DollarSign, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart as BarChartIcon, Check, Building as BuildingIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, Apartment, Payment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReportsProps {
  building: Building | null;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Reports({ building }: ReportsProps) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [building, selectedYear]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const totalCollectedThisYear = payments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const apartmentsPaidThisMonth = new Set(
    payments
      .filter(p => Number(p.month) === currentMonth && Number(p.year) === currentYear && p.payment_status === 'paid')
      .map(p => p.apartment_id)
  ).size;

  const apartmentsUnpaidThisMonth = apartments.length - apartmentsPaidThisMonth;

  const monthlyReport = MONTHS.map((name, i) => {
    const month = i + 1;
    const monthPayments = payments.filter(p => Number(p.month) === month);
    const collected = monthPayments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const paidCount = new Set(
      monthPayments
        .filter(p => p.payment_status === 'paid')
        .map(p => p.apartment_id)
    ).size;
    
    return {
      name: name.substring(0, 3),
      fullName: name,
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

  const unpaidByApartment = sortedApartments.map(apt => {
    const aptPayments = payments.filter(p => p.apartment_id === apt.id);
    const unpaidMonths = [];
    
    const limit = selectedYear === currentYear ? currentMonth : 12;
    
    for (let m = 1; m <= limit; m++) {
      const p = aptPayments.find(pay => Number(pay.month) === m);
      if (!p || p.payment_status === 'unpaid') {
        unpaidMonths.push(MONTHS[m - 1]);
      }
    }

    return {
      aptNum: apt.apartment_number,
      owner: apt.owner_name,
      phone: apt.phone,
      unpaidMonths,
      totalDue: unpaidMonths.length * (building?.monthly_contribution || 0)
    };
  }).filter(item => item.unpaidMonths.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h2>
          <p className="text-slate-500 font-medium">Detailed performance for {selectedYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ArrowUpRight size={80} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected This Year</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalCollectedThisYear.toLocaleString()} <span className="text-sm font-bold text-slate-400">MAD</span></p>
          <p className="mt-2 text-xs font-bold text-emerald-500 flex items-center gap-1">
            <TrendingUp size={12} /> +12.5% from last year
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Check size={80} className="text-indigo-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BuildingIcon size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apartments Paid (Current Month)</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{apartmentsPaidThisMonth}</p>
          <p className="mt-2 text-xs font-bold text-slate-400">Out of {apartments.length} total units</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertCircle size={80} className="text-rose-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apartments Unpaid (Current Month)</span>
          </div>
          <p className="text-3xl font-black text-rose-600">{apartmentsUnpaidThisMonth}</p>
          <p className="mt-2 text-xs font-bold text-rose-400">Requires follow up</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChartIcon className="text-indigo-500" size={20} />
              <h3 className="font-bold text-lg text-slate-900">Revenue Breakdown</h3>
            </div>
          </div>
          <div className="p-6 h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReport}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="collected" radius={[6, 6, 0, 0]} barSize={30}>
                  {monthlyReport.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.collected > 0 ? '#6366f1' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-500" size={20} />
              <h3 className="font-bold text-lg text-slate-900">Unpaid Apartments</h3>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-black rounded-full uppercase tracking-wider">
              {unpaidByApartment.length} Units
            </span>
          </div>
          <div className="overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-start border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apt</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unpaid Months</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-end">Total Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidByApartment.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <Check size={40} className="text-emerald-500" />
                        <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">All Clear!</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  unpaidByApartment.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                          {row.aptNum}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{row.owner}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {row.unpaidMonths.map(m => (
                            <span key={m} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider border border-rose-100">
                              {m.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <span className="font-black text-rose-600">{row.totalDue} MAD</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="text-indigo-500" size={20} />
          <h3 className="font-bold text-lg text-slate-900">Monthly Performance Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Month</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Collected</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Paid Units</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Unpaid Units</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-end">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyReport.map((row) => {
                const progress = apartments.length > 0 ? (row.paidCount / apartments.length) * 100 : 0;
                return (
                  <tr key={row.fullName} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.fullName}</td>
                    <td className="px-6 py-4 text-center font-black text-emerald-600">{row.collected.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">{row.paidCount}</td>
                    <td className="px-6 py-4 text-center font-bold text-rose-500">{row.unpaidCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-400 w-8">{Math.round(progress)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
