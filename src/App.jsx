import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import AcceptInvite from './pages/AcceptInvite';
import Dashboard from './pages/dashboard';
import Shifts from './pages/Shift';
import Requests from './pages/Requests';
import ActivityLog from './pages/ActivityLog';
import Chat from './pages/Chat';
import Posts from './pages/Posts';
import Goals from './pages/Goals';
import EmployeeData from './pages/EmployeeData';
import BusinessPartnerPage from './pages/BusinessPartner';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          {/* Logged-in users only */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/shifts" element={<Shifts />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/activity-log" element={<ActivityLog />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/employee-data" element={<EmployeeData />} />
              <Route path="/employees" element={<Navigate to="/employee-data" replace />} />
              <Route path="/partners" element={<BusinessPartnerPage />} />
              {/* add the other module pages here as you build them */}
            </Route>
          </Route>

          {/* Anything else */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
