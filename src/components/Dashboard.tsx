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

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function fetchData() {
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
        
        // Fetch all payments for the current month and year
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('month', currentMonth)
          .eq('year', currentYear);

        // Filter payments to only include those belonging to this building's apartments
        const buildingAptIds = apts.map(a => a.id);
        const buildingPayments = payments ? payments.filter(p => buildingAptIds.includes(p.apartment_id)) : [];

        const paidThisMonth = buildingPayments.filter(p => p.payment_status === 'paid').length;
        const unpaidThisMonth = apts.length - paidThisMonth;
        const totalCollected = paidThisMonth * building.monthly_contribution;

        setStats({
          totalApartments: apts.length,
          paidThisMonth: paidThisMonth,
          unpaidThisMonth: unpaidThisMonth,
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
          .limit(5);
        
        if (activity) setRecentActivity(activity);
      }
      setLoading(false);
    }
    fetchData();
  }, [building, currentMonth, currentYear]);

  const statCards = [
    { label: 'Total Apartments', value: stats.totalApartments, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Paid This Month', value: stats.paidThisMonth, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unpaid This Month', value: stats.unpaidThisMonth, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Collected (MAD)', value: stats.totalCollected.toLocaleString(), icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Overview of {building?.building_name}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onAddPayment}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus size={20} />
            Add Payment
          </button>
          <button 
            onClick={onViewApartments}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <Building2 size={20} />
            View Apartments
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-900">Apartments List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Apt #</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Owner Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">Loading apartments...</td>
                  </tr>
                ) : apartments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">No apartments found.</td>
                  </tr>
                ) : (
                  apartments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                          {apt.apartment_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{apt.owner_name}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-sm">{apt.phone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <History size={20} className="text-emerald-500" />
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No recent activity</p>
              ) : (
                recentActivity.map((log) => (
                  <div key={log.id} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm z-10 ${
                        log.action_type === 'create' ? 'bg-emerald-500' :
                        log.action_type === 'update' ? 'bg-blue-500' : 'bg-rose-500'
                      }`}>
                        {log.action_type === 'create' ? <Plus size={14} /> :
                         log.action_type === 'update' ? <Edit2 size={14} /> : <Trash2 size={14} />}
                      </div>
                      <div className="w-0.5 h-full bg-slate-100 absolute top-8" />
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-sm font-bold text-slate-900 capitalize">
                        {log.action_type} {log.entity_type}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        By {log.profiles?.email || 'System'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
