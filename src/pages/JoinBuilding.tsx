import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, MapPin, User, Phone, Hash, ArrowRight, CheckCircle2, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Apartment, Building } from '../types';

export default function JoinBuilding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [foundApartment, setFoundApartment] = useState<Apartment | null>(null);
  const [foundBuilding, setFoundBuilding] = useState<Building | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'search' | 'confirm'>('search');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteCode) return;

    setIsSearching(true);
    setError(null);
    setFoundApartment(null);
    setFoundBuilding(null);

    try {
      const { data: apartment, error: apartmentError } = await supabase
        .from('apartments')
   select('*')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (apartmentError) throw apartmentError;

      if (apartment) {
        setFoundApartment(apartment);
        setFoundBuilding(apartment.buildings);
        setStep('confirm');
      } else {
        setError('Could not find an apartment with this invite code. Please check and try again.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again later.');
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
    if (!user || !foundApartment) return;
    
    setIsSearching(true);
    try {
      // Update user profile with apartment_id and role
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          apartment_id: foundApartment.id,
          role: 'owner'
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Join error:', err);
      setError('An error occurred while joining. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  if (step === 'confirm' && foundApartment && foundBuilding) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Confirm Details</h1>
              <p className="text-slate-500 mt-2 font-medium">Please verify the information below before joining.</p>
            </div>
            <button 
              onClick={() => setStep('search')}
              className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-10 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Building2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{foundBuilding.name}</h3>
                  <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mt-1">
                    <MapPin size={14} />
                    {foundBuilding.address}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">First Name</p>
                  <p className="text-lg font-black text-slate-900">{profile?.first_name || 'Not set'}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Name</p>
                  <p className="text-lg font-black text-slate-900">{profile?.last_name || 'Not set'}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apartment Number</p>
                  <p className="text-lg font-black text-slate-900">{foundApartment.number}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-lg font-black text-slate-900">{profile?.phone || 'Not set'}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleJoin}
              disabled={isSearching}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {isSearching ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={24} />}
              Confirm and Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join Building</h1>
            <p className="text-slate-500 mt-2 font-medium">Enter the invite code provided by your manager.</p>
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
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Invite Code</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="e.g. ABC-123-XYZ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all text-center tracking-widest"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isSearching}
                className="px-8 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 font-bold text-sm leading-relaxed">
              {error}
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowRight size={16} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
