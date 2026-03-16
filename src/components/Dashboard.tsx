import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Wallet, Plus, ArrowRight, Building2, History, Edit2, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Building, Apartment, Payment, AuditLog } from '../types';

interface DashboardProps {
  building: Building | null;
  onAddPayment?: () => void;
  onViewApartments?: () => void;
}

export default function Dashboard({ building, onAddPayment, onViewApartments }: DashboardProps) {
  const [stats, setStats] = useState({
    totalApartments: 0,
    paidThisMonth: 0,
    unpaidThisMonth: 0,
    totalCollected: 0
  });
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!building) return;

    // Fetch apartments sorted ascending by number
    const { data: apts } = await supabase
      .from('apartments')
      .select('*')
      .eq('building_id', building.id);

    if (apts) {
      // Sort numerically if possible
      const sortedApts = [...apts].sort((a, b) => {
        const numA = parseInt(String(a.apartment_number));
        const numB = parseInt(String(b.apartment_number));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.apartment_number).localeCompare(String(b.apartment_number));
      });
      setApartments(sortedApts);
      
      const aptIds = apts.map(a => a.id);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Fetch payments for current month
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('apartment_id')
        .in('apartment_id', aptIds)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .eq('payment_status', 'paid');

      const paidCount = new Set(monthPayments?.map(p => p.apartment_id)).size;

      // Fetch total collected for the current year
      const { data: yearPayments } = await supabase
        .from('payments')
        .select('amount')
        .in('apartment_id', aptIds)
        .eq('year', currentYear)
        .eq('payment_status', 'paid');

      const totalCollected = yearPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        totalApartments: apts.length,
        paidThisMonth: paidCount,
        unpaidThisMonth: apts.length - paidCount,
        totalCollected: totalCollected
      });

      // Fetch recent activity
      const { data: activity } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:performed_by (
            email
          )
        `)
        .eq('building_id', building.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (activity) setRecentActivity(activity);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          console.log('Payment change detected in Dashboard');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'apartments' },
        () => {
          console.log('Apartment change detected in Dashboard');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => {
          console.log('Audit log change detected in Dashboard');
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [building]);

  const formatActivityMessage = (log: AuditLog) => {
    const data = log.new_data || log.old_data;
    const action = log.action_type;
    const entity = log.entity_type;

    if (entity === 'payment') {
      const monthName = data?.month ? MONTHS[data.month - 1] : '';
      if (action === 'create') return `Apt ${data?.apartment_number || 'Unknown'} paid ${monthName} – ${data?.amount} MAD`;
      if (action === 'update') return `Payment updated for Apt ${data?.apartment_number || 'Unknown'} (${monthName})`;
      if (action === 'delete') return `Payment deleted for Apt ${data?.apartment_number || 'Unknown'}`;
    }

    if (entity === 'apartment') {
      if (action === 'create') return `Apt ${data?.apartment_number} added`;
      if (action === 'update') return `Apt ${data?.apartment_number} info updated`;
      if (action === 'delete') return `Apt ${data?.apartment_number} removed`;
    }

    if (entity === 'building') {
      if (action === 'create') return `Building ${data?.building_name} created`;
      if (action === 'update') return `Building settings updated`;
    }

    return `${action} ${entity}`;
  };

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const statCards = [
    { label: 'Total Apartments', value: stats.totalApartments, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Paid This Month', value: stats.paidThisMonth, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unpaid This Month', value: stats.unpaidThisMonth, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Collected (MAD)', value: stats.totalCollected.toLocaleString(), icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 font-medium">Overview of {building?.building_name}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onAddPayment}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Add Payment
          </button>
          <button 
            onClick={onViewApartments}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all active:scale-95"
          >
            <Building2 size={18} />
            View Apartments
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={22} />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Apartments Overview</h3>
            <button onClick={onViewApartments} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Apt #</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Owner Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="text-sm font-medium">Loading apartments...</span>
                      </div>
                    </td>
                  </tr>
                ) : apartments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">No apartments found.</td>
                  </tr>
                ) : (
                  apartments.slice(0, 5).map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">
                          {apt.apartment_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{apt.owner_name}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-sm">{apt.phone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <History size={20} className="text-indigo-500" />
              Recent Activity
            </h3>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <History size={40} strokeWidth={1.5} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((log, idx) => (
                  <div key={log.id} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm z-10 ${
                        log.action_type === 'create' ? 'bg-emerald-500' :
                        log.action_type === 'update' ? 'bg-indigo-500' : 'bg-rose-500'
                      }`}>
                        {log.action_type === 'create' ? <Plus size={16} /> :
                         log.action_type === 'update' ? <Edit2 size={16} /> : <Trash2 size={16} />}
                      </div>
                      {idx !== recentActivity.length - 1 && (
                        <div className="w-px h-full bg-slate-100 absolute top-9 left-[17.5px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {formatActivityMessage(log)}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Users size={10} />
                          {log.profiles?.email?.split('@')[0] || 'System'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
