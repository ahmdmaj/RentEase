// ─── Database Types (match Supabase schema exactly) ──────────────────────────

export type UserRole = 'renter' | 'owner' | 'admin';

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  email?: string;
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
  vehicle_type: string | null;
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
  profiles?: Pick<Profile, 'full_name' | 'phone'>;
  vehicle_images?: VehicleImage[];
};

export type BookingStatus = 'pending' | 'approved' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type Booking = {
  id: string;
  vehicle_id: string;
  renter_id: string;
  start_date: string;   // ISO date string "YYYY-MM-DD"
  end_date: string;
  total_price: number;
  status: BookingStatus;
  payment_status?: PaymentStatus;
  created_at: string;
  // joined relations
  vehicles?: Pick<Vehicle, 'id' | 'make' | 'model' | 'location' | 'price_per_day' | 'owner_id'> & {
    vehicle_images?: VehicleImage[];
  };
  profiles?: Pick<Profile, 'full_name' | 'phone'>;
};

export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  transaction_id: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  bookings?: Booking;
};

export type OwnerApplication = {
  id: string;
  profile_id: string;
  business_name: string | null;
  nic_number: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  vehicle_id: string;
  renter_id: string;
  owner_id: string;
  created_at: string;
  // joined relations
  vehicles?: Pick<Vehicle, 'id' | 'make' | 'model' | 'location' | 'price_per_day'> & {
    vehicle_images?: VehicleImage[];
  };
  renter?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  owner?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  last_message?: Message;
  unread_count?: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: Pick<Profile, 'full_name' | 'avatar_url'>;
};

// ─── RPC Return Types ────────────────────────────────────────────────────────

export type BookingRPCResult = {
  success: boolean;
  booking_id?: string;
  total_price?: number;
  status?: string;
  error?: string;
};
