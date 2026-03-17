-- 1. Create Tables

-- Buildings Table
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    building_name TEXT, -- Backward compatibility
    address TEXT NOT NULL,
    building_address TEXT, -- Backward compatibility
    total_apartments INTEGER DEFAULT 0,
    monthly_contribution DECIMAL(10, 2) DEFAULT 0,
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apartments Table
CREATE TABLE apartments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    apartment_number TEXT, -- Backward compatibility
    owner_name TEXT, -- Backward compatibility
    floor TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (Extends Auth.Users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('owner', 'admin')) DEFAULT 'owner',
    apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    status TEXT CHECK (status IN ('paid', 'unpaid')) DEFAULT 'unpaid',
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Users Policies
CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- Apartments Policies
CREATE POLICY "Admins can manage apartments in their building"
ON apartments FOR ALL
USING (
    building_id IN (SELECT id FROM buildings WHERE owner_id = auth.uid())
);

CREATE POLICY "Users can view their own apartment" 
ON apartments FOR SELECT 
USING (
    id IN (SELECT apartment_id FROM users WHERE id = auth.uid())
    OR 
    invite_code IS NOT NULL -- Allow searching by invite code
);

-- Buildings Policies
CREATE POLICY "Admins can manage their own building"
ON buildings FOR ALL
USING (owner_id = auth.uid());

CREATE POLICY "Users can view their building" 
ON buildings FOR SELECT 
USING (
    id IN (
        SELECT building_id FROM apartments 
        WHERE id IN (SELECT apartment_id FROM users WHERE id = auth.uid())
    )
);

-- Payments Policies
CREATE POLICY "Admins can view all payments in their building"
ON payments FOR SELECT
USING (
    apartment_id IN (
        SELECT id FROM apartments 
        WHERE building_id IN (SELECT id FROM buildings WHERE owner_id = auth.uid())
    )
);

CREATE POLICY "Users can view their own payments" 
ON payments FOR SELECT 
USING (
    apartment_id IN (SELECT apartment_id FROM users WHERE id = auth.uid())
);

-- 4. Functions & Triggers (Optional but recommended for auto-profile creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'owner');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
