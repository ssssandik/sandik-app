export interface Building {
  id: string;
  name: string;
  address: string;
  building_name?: string; // Backward compatibility
  building_address?: string; // Backward compatibility
  total_apartments?: number; // Backward compatibility
  monthly_contribution?: number; // Backward compatibility
  created_at: string;
}

export interface Apartment {
  id: string;
  building_id: string;
  number: string;
  apartment_number?: string; // Backward compatibility
  owner_name?: string; // Backward compatibility
  floor: string | null;
  invite_code: string;
  is_occupied: boolean;
  created_at: string;
  buildings?: Building; // For joined queries
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'owner' | 'admin';
  apartment_id: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  apartment_id: string;
  amount: number;
  month: number;
  year: number;
  status: 'paid' | 'unpaid' | 'late'; // Added 'late' for compatibility
  payment_status?: 'paid' | 'unpaid' | 'late'; // Backward compatibility
  payment_date: string | null;
  created_at: string;
}

export type PaymentStatus = 'paid' | 'unpaid' | 'late';

export interface AuditLog {
  id: string;
  entity_type: 'building' | 'apartment' | 'payment';
  entity_id: string;
  action_type: 'create' | 'update' | 'delete';
  performed_by: string;
  building_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  profiles?: {
    email: string;
  };
}
