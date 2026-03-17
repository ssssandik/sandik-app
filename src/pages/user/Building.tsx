import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Users, Calendar, Shield, Info, Globe, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { Building, Apartment } from '../../types';

export default function BuildingDetails() {
  const { profile } = useAuth();
  const [building, setBuilding] = useState<Building | null>(null);
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBuildingData() {
      if (!profile?.apartment_id) return;

      try {
        const { data: aptData, error: aptError } = await supabase
          .from('apartments')
          .select('*, buildings(*)')
          .eq('id', profile.apartment_id)
          .single();

        if (aptError) throw aptError;
        if (aptData) {
          setApartment(aptData);
          setBuilding(aptData.buildings);
        }
      } catch (err) {
        console.error('Error fetching building data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBuildingData();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="p-12 text-center bg-white rounded-[40px] border border-slate-200 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Building2 size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">No Building Found</h3>
        <p className="text-slate-500 font-medium">You haven't joined a building yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative h-64 rounded-[40px] overflow-hidden group">
        <img 
          src="https://picsum.photos/seed/building/1200/400" 
          alt="Building" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="absolute bottom-10 left-10 text-white">
          <h1 className="text-4xl font-black tracking-tight mb-2">{building.name}</h1>
          <div className="flex items-center gap-3 text-slate-200 font-medium">
            <MapPin size={18} />
            {building.address}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Info size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Building Information</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Building Name</p>
                <p className="text-xl font-black text-slate-900">{building.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Address</p>
                <p className="text-xl font-black text-slate-900">{building.address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Construction Date</p>
                <p className="text-xl font-black text-slate-900">January 2020</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Management Type</p>
                <p className="text-xl font-black text-indigo-600">Professional Syndic</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Shield size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Your Apartment</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apt Number</p>
                <p className="text-xl font-black text-slate-900">{apartment?.number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Floor</p>
                <p className="text-xl font-black text-slate-900">{apartment?.floor || '---'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                <p className="text-xl font-black text-emerald-600">Occupied</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">Building Stats</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                    <Users size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Total Units</p>
                </div>
                <p className="font-black text-slate-900">24</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                    <Shield size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Security 24/7</p>
                </div>
                <p className="font-black text-emerald-600">Active</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                    <Globe size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Fiber Optic</p>
                </div>
                <p className="font-black text-emerald-600">Available</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[40px] p-8 text-white">
            <h3 className="text-xl font-black mb-4">Contact Manager</h3>
            <p className="text-slate-400 text-sm font-medium mb-6">Need assistance? Contact the building manager directly.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <Phone size={20} className="text-indigo-400" />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manager Phone</p>
                  <p className="text-sm font-bold">+212 600-000000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
