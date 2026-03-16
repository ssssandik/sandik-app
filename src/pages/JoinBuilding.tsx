import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, ArrowRight, X, ChevronLeft, Search, Building2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Building } from '../types';

export default function JoinBuilding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [foundBuilding, setFoundBuilding] = useState<Building | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteCode) return;

    setIsSearching(true);
    setError(null);
    setFoundBuilding(null);

    try {
      // In a real app, we'd search by a dedicated invite_code column.
      // For now, we'll try to search by ID as a fallback.
      const { data, error: searchError } = await supabase
        .from('apartments')
.select(`
  *,
  buildings (*)
`)
.eq('invite_code', inviteCode)
        .maybeSingle();

      if (searchError) throw searchError;

      if (data) {
        setFoundBuilding(data);
      } else {
        setError('عذراً، لم نتمكن من العثور على عمارة بهذا الكود. يرجى التأكد من الكود والمحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setError('حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('code')) {
      handleSearch();
    }
  }, []);

  const handleJoin = async () => {
    if (!user) return;
    
    // Logic to join would go here (e.g. creating a resident record or linking user to building)
    // For now, we'll just show a success message and redirect.
    alert('تم الانضمام بنجاح! يمكنك الآن متابعة وضعية شقتك.');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">الانضمام إلى عمارة</h1>
            <p className="text-slate-500 mt-2 font-medium">أدخل كود الدعوة الذي زودك به السنديك للانضمام.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">كود الدعوة</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="مثال: ABC-123-XYZ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full pr-14 pl-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all text-center tracking-widest"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isSearching}
                className="px-8 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'بحث'}
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 font-bold text-sm leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            {foundBuilding && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] space-y-6"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Building2 size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{foundBuilding.building_name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mt-1">
                      <MapPin size={14} />
                      {foundBuilding.building_address}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 p-4 rounded-2xl border border-blue-200/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المساهمة الشهرية</p>
                    <p className="text-lg font-black text-blue-600">{foundBuilding.monthly_contribution} MAD</p>
                  </div>
                  <div className="bg-white/50 p-4 rounded-2xl border border-blue-200/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الشقق</p>
                    <p className="text-lg font-black text-slate-700">{foundBuilding.total_apartments} وحدة</p>
                  </div>
                </div>

                <button 
                  onClick={handleJoin}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Users size={24} />
                  تأكيد الانضمام للعمارة
                  <ChevronLeft size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowRight size={16} />
            العودة للرئيسية
          </button>
        </div>
      </motion.div>
    </div>
  );
}
