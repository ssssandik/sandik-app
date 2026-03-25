import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export default function JoinBuilding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [apartment, setApartment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔍 SEARCH
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteCode) return;

    setIsSearching(true);
    setError(null);
    setApartment(null);

    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (error) throw error;

      setApartment(data);
    } catch (err) {
      console.error(err);
      setError('Invalid code or no data found');
    } finally {
      setIsSearching(false);
    }
  };

  // ✅ JOIN
  const handleJoin = async () => {
    if (!user || !apartment) return;

    setIsSearching(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          apartment_id: apartment.id,
          role: 'owner'
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Join failed');
    } finally {
      setIsSearching(false);
    }
  };

  // ✅ IF FOUND → CONFIRM
  if (apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center space-y-6">
          <h2 className="text-2xl font-bold">Confirm Apartment</h2>

          <p className="text-gray-600">
            Apartment Number: <strong>{apartment.number}</strong>
          </p>

          <button
            onClick={handleJoin}
            className="w-full bg-black text-white py-3 rounded-xl font-bold"
          >
            {isSearching ? 'Joining...' : 'Confirm & Join'}
          </button>
        </div>
      </div>
    );
  }

  // 🔍 SEARCH UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Join Building</h2>
          <button onClick={() => navigate('/')}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <input
            type="text"
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full border p-3 rounded-xl text-center"
          />

          <button className="w-full bg-black text-white py-3 rounded-xl font-bold">
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
