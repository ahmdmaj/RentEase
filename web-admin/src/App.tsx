import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './pages/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OwnerApprovals from './pages/OwnerApprovals';
import Users from './pages/Users';
import Vehicles from './pages/Vehicles';
import Bookings from './pages/Bookings';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/approvals" element={<OwnerApprovals />} />
              <Route path="/users" element={<Users />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/bookings" element={<Bookings />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;