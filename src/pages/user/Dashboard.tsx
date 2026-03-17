import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle2, Clock, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { Payment } from '../../types';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaid: 0,
    unpaidMonths: 0,
    lastPayment: null as Payment | null
  });

  useEffect(() => {
    async function fetchDashboardData() {
      if (!profile?.apartment_id) return;

      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('apartment_id', profile.apartment_id)
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (error) throw error;

        if (data) {
          setPayments(data);
          
          const totalPaid = data
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + Number(p.amount), 0);
          
          const unpaidMonths = data.filter(p => p.status === 'unpaid').length;
          const lastPayment = data.find(p => p.status === 'paid') || null;

          setStats({
            totalPaid,
            unpaidMonths,
            lastPayment
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {profile?.first_name}!</h1>
          <p className="text-slate-500 font-medium">Here's an overview of your apartment status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.totalPaid} <span className="text-lg text-slate-400">MAD</span></p>
          <p className="text-xs font-bold text-slate-400 mt-2">Lifetime contributions</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
              <AlertCircle size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unpaid</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.unpaidMonths} <span className="text-lg text-slate-400">Months</span></p>
          <p className="text-xs font-bold text-rose-500 mt-2">Action required</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Payment</span>
          </div>
          <p className="text-xl font-black text-slate-900">
            {stats.lastPayment ? `${stats.lastPayment.amount} MAD` : 'No payments yet'}
          </p>
          <p className="text-xs font-bold text-slate-400 mt-2">
            {stats.lastPayment ? new Date(stats.lastPayment.payment_date!).toLocaleDateString() : '---'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Recent Payments</h3>
            <Link to="/payments" className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${payment.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {payment.status === 'paid' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">Month {payment.month}, {payment.year}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {payment.status === 'paid' ? `Paid on ${new Date(payment.payment_date!).toLocaleDateString()}` : 'Pending payment'}
                    </p>
                  </div>
                </div>
                <p className="font-black text-slate-900">{payment.amount} MAD</p>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-medium">
                No payment history found.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-[40px] p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <CreditCard size={160} />
            </div>
            <h3 className="text-2xl font-black mb-4">Quick Pay</h3>
            <p className="text-indigo-100 font-medium mb-8 leading-relaxed">
              You have {stats.unpaidMonths} pending payments. Keep your account up to date to ensure smooth building management.
            </p>
            <Link 
              to="/payments" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20"
            >
              Go to Payments <ArrowRight size={20} />
            </Link>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">Quick Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/profile" className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600">Profile</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Update Info</p>
              </Link>
              <Link to="/building" className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600">Building</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">View Details</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
