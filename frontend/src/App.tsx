import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Procurement from './pages/Procurement';
import PremiumReport from './pages/PremiumReport';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Admin from './pages/Admin';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/signup" element={<Auth initialMode="signup" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/premium-report" element={<PremiumReport />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </Router>
    </AppProvider>
  );
}
