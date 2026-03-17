import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, X, ChevronLeft } from 'lucide-react';
// import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { auditService } from '../services/auditService';

export default function CreateBuilding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    total_units: 10,
    monthly_fee: 100
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.name || !form.address) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('buildings')
        .insert([{ 
          building_name: form.name, 
          building_address: form.address,
          total_apartments: form.total_units,
          monthly_contribution: form.monthly_fee,
          owner_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        // Update user role to 'syndic'
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ role: 'syndic' })
          .eq('id', user.id);

        if (userUpdateError) throw userUpdateError;

        await refreshProfile();
        await auditService.logCreate('building', data.id, data.id, data);
        navigate('/dashboard');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div 
        className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">إعداد العمارة الجديدة</h1>
            <p className="text-slate-500 mt-2 font-medium">أدخل تفاصيل العمارة لتبدأ في إدارتها باحترافية.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">اسم العمارة</label>
            <div className="relative">
              <Building2 className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="مثال: إقامة الأمل"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full pr-14 pl-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">العنوان</label>
            <input 
              type="text" 
              placeholder="مثال: 123 شارع الحسن الثاني، الدار البيضاء"
              value={form.address}
              onChange={(e) => setForm({...form, address: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">عدد الشقق</label>
              <input 
                type="number" 
                value={form.total_units}
                onChange={(e) => setForm({...form, total_units: Number(e.target.value)})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all"
                min="1"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">المساهمة الشهرية (درهم)</label>
              <input 
                type="number" 
                value={form.monthly_fee}
                onChange={(e) => setForm({...form, monthly_fee: Number(e.target.value)})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all"
                min="0"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isSaving}
              className={`w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Building2 size={24} />
              )}
              {isSaving ? 'جاري الإعداد...' : 'بدء إدارة العمارة'}
              {!isSaving && <ChevronLeft size={20} />}
            </button>
          </div>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowRight size={16} />
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
