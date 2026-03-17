import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User as UserIcon, 
  LogOut, 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  Clock,
  AlertCircle
} from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export default function OwnerDashboard() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOwnerData() {
      if (!user) return;
      
      try {
        const { data: apartment, error: aptError } = await supabase
          .from('apartments')
          .select('*, buildings(*)')
          .eq('owner_user_id', user.id)
          .maybeSingle();
        
        if (aptError) throw aptError;
        
        if (apartment) {
          setData(apartment);
          
          // Fetch payment history
          const { data: history, error: historyError } = await supabase
            .from('payments')
            .select('*')
            .eq('apartment_id', apartment.id)
            .order('year', { ascending: false })
            .order('month', { ascending: false });
          
          if (historyError) throw historyError;
          setPayments(history || []);
        } else {
          setError('لم يتم العثور على شقة مرتبطة بحسابك. يرجى الانضمام إلى عمارة أولاً.');
        }
      } catch (err: any) {
        console.error('Error fetching owner data:', err);
        setError('حدث خطأ أثناء جلب البيانات.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOwnerData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-100">S</div>
            <span className="font-black text-2xl tracking-tight text-slate-900">Sandik</span>
            <span className="hidden md:block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mr-2">لوحة المالك</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-black text-slate-900 leading-none">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{user?.email}</p>
            </div>
            <button 
              onClick={() => signOut()}
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="تسجيل الخروج"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        {error ? (
          <div 
            className="bg-white rounded-[40px] shadow-2xl border border-slate-200 p-12 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">{error}</h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto">إذا كان لديك كود دعوة من السنديك، يمكنك استخدامه للانضمام إلى عمارتك.</p>
            <button 
              onClick={() => window.location.href = '/join-building'}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              الانضمام إلى عمارة
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">مرحباً بك في Sandik</h1>
                <p className="text-slate-500 mt-2 font-medium text-lg">إليك نظرة شاملة على وضعية شقتك في {data?.buildings?.building_name}.</p>
              </div>
              <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم الشقة</p>
                  <p className="text-xl font-black text-slate-900">{data?.apartment_number}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Building Info Card */}
              <div 
                className="lg:col-span-2 bg-white rounded-[40px] shadow-xl border border-slate-200 overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-black text-xl text-slate-900">معلومات العمارة</h3>
                  <MapPin size={20} className="text-slate-400" />
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">اسم العمارة</label>
                      <p className="text-xl font-black text-slate-900">{data?.buildings?.building_name}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">العنوان</label>
                      <p className="text-slate-600 font-bold leading-relaxed">{data?.buildings?.building_address}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">المساهمة الشهرية</label>
                        <CreditCard size={16} className="text-emerald-500" />
                      </div>
                      <p className="text-3xl font-black text-emerald-700">{data?.buildings?.monthly_contribution} <span className="text-sm">MAD</span></p>
                    </div>
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">السنديك المسؤول</p>
                        <p className="text-sm font-black text-slate-900">إدارة العمارة</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status Card */}
              <div 
                className="bg-slate-900 rounded-[40px] shadow-2xl p-8 text-white flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12">
                  <CreditCard size={150} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-xl">حالة الدفع</h3>
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">الشهر الحالي</p>
                      <div className="flex items-center gap-3">
                        {payments.length > 0 && payments[0].month === new Date().getMonth() + 1 && payments[0].year === new Date().getFullYear() && payments[0].payment_status === 'paid' ? (
                          <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 font-black text-sm">
                            تم الدفع
                          </div>
                        ) : (
                          <div className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30 font-black text-sm">
                            في انتظار الدفع
                          </div>
                        )}
                        <span className="text-slate-500 text-xs font-bold">
                          {new Intl.DateTimeFormat('ar-MA', { month: 'long' }).format(new Date())} {new Date().getFullYear()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">آخر العمليات</p>
                      <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {payments.length > 0 ? (
                          payments.map((payment, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="font-bold">
                                {new Intl.DateTimeFormat('ar-MA', { month: 'long' }).format(new Date(payment.year, payment.month - 1))} {payment.year}
                              </span>
                              <span className={`font-black ${payment.payment_status === 'paid' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {payment.payment_status === 'paid' ? 'تم الدفع' : 'متأخر'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 text-xs italic">لا يوجد سجل مدفوعات حالياً</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button className="relative z-10 mt-10 w-full py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                  <CreditCard size={18} />
                  عرض السجل المالي
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'الإبلاغ عن عطب', icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
                { title: 'التواصل مع السنديك', icon: UserIcon, color: 'bg-blue-50 text-blue-600' },
                { title: 'قوانين العمارة', icon: Building2, color: 'bg-slate-100 text-slate-600' }
              ].map((action, i) => (
                <button key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                  <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon size={24} />
                  </div>
                  <span className="font-black text-slate-900">{action.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
