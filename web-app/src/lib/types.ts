// ─── Database Types (match Supabase schema exactly) ──────────────────────────

export type UserRole = 'renter' | 'owner' | 'admin';

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type VehicleImage = {
  id: string;
  vehicle_id: string;
  image_url: string;
  display_order: number;
};

export type Vehicle = {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number | null;
  transmission: 'Automatic' | 'Manual' | null;
  fuel_type: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric' | null;
  seating_capacity: number | null;
  location: string;
  price_per_day: number;
  description: string | null;
  is_available: boolean;
  created_at: string;
  // joined relations
  profiles?: Pick<Profile, 'full_name'>;
  vehicle_images?: VehicleImage[];
};

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export type Booking = {
  id: string;
  vehicle_id: string;
  renter_id: string;
  start_date: string;   // ISO date string "YYYY-MM-DD"
  end_date: string;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  // joined relations
  vehicles?: Pick<Vehicle, 'id' | 'make' | 'model' | 'location' | 'price_per_day'> & {
    vehicle_images?: VehicleImage[];
  };
  profiles?: Pick<Profile, 'full_name' | 'phone'>;
};

export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  transaction_id: string | null;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
};

export type OwnerApplication = {
  id: string;
  profile_id: string;
  business_name: string | null;
  nic_number: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
};

// ─── RPC Return Types ────────────────────────────────────────────────────────

export type BookingRPCResult = {
  success: boolean;
  booking_id?: string;
  total_price?: number;
  status?: string;
  error?: string;
};
