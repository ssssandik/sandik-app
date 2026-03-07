export interface Building {
  id: string;
  building_name: string;
  building_address: string;
  total_apartments: number;
  monthly_contribution: number;
  created_at: string;
}

export interface Apartment {
  id: string;
  building_id: string;
  apartment_number: string;
  owner_name: string;
  phone: string;
  created_at: string;
}

export interface Payment {
  id: string;
  apartment_id: string;
  month: number; // 1-12
  year: number;
  amount: number;
  payment_status: 'paid' | 'unpaid' | 'late';
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
