import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export default function JoinBuilding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [apartment, setApartment] = useState<any>(null);
  const [error, setError] = useState('');

  // SEARCH
  const handleSearch = async () => {
    if (!code) return;

    setLoading(true);
    setError('');
    setApartment(null);

    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('invite_code', code.trim())
        .single();

      if (error || !data) {
        setError('Code not found');
      } else {
        setApartment(data);
      }
    } catch (e) {
      setError('Error searching');
    }

    setLoading(false);
  };

  // JOIN
  const handleJoin = async () => {
    if (!user || !apartment) return;

    setLoading(true);

    try {
      await supabase
        .from('users')
        .update({
          apartment_id: apartment.id,
          role: 'owner'
        })
        .eq('id', user.id);

      navigate('/dashboard');
    } catch (e) {
      setError('Join failed');
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>Join Building</h2>

      {/* INPUT */}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter code"
        style={{ padding: 10, width: 200 }}
      />

      <br /><br />

      {/* SEARCH */}
      <button onClick={handleSearch}>
        {loading ? 'Loading...' : 'Search'}
      </button>

      {/* ERROR */}
      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}

      {/* RESULT */}
      {apartment && (
        <div style={{ marginTop: 20 }}>
          <p>Apartment: {apartment?.number || 'N/A'}</p>

          <button onClick={handleJoin}>
            Confirm Join
          </button>
        </div>
      )}
    </div>
  );
}
