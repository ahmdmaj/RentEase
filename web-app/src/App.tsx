import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Listings
import HomePage from './pages/listings/HomePage';
import VehicleDetailPage from './pages/listings/VehicleDetailPage';
import MyListingsPage from './pages/listings/MyListingsPage';
import AddVehiclePage from './pages/listings/AddVehiclePage';
import EditVehiclePage from './pages/listings/EditVehiclePage';

// Booking
import BookingPage from './pages/booking/BookingPage';
import MyBookingsPage from './pages/booking/MyBookingsPage';
import OwnerBookingsPage from './pages/booking/OwnerBookingsPage';

// Payment
import PaymentPage from './pages/payment/PaymentPage';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';

// Messaging
import ChatListPage from './pages/messaging/ChatListPage';
import ChatPage from './pages/messaging/ChatPage';
import NotificationsPage from './pages/messaging/NotificationsPage';

// Profile
import ProfilePage from './pages/profile/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes (require login) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Listings */}
              <Route path="/" element={<HomePage />} />
              <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
              <Route path="/my-listings" element={<MyListingsPage />} />
              <Route path="/add-vehicle" element={<AddVehiclePage />} />
              <Route path="/edit-vehicle/:id" element={<EditVehiclePage />} />

              {/* Booking */}
              <Route path="/book/:id" element={<BookingPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/owner-bookings" element={<OwnerBookingsPage />} />

              {/* Payment */}
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />

              {/* Messaging */}
              <Route path="/messages" element={<ChatListPage />} />
              <Route path="/chat/:id" element={<ChatPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Profile */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
