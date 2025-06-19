import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import CampaignsPage from './pages/CampaignsPage';
import BulkOutreachPage from './pages/BulkOutreachPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/bulk-outreach" element={<BulkOutreachPage />} />
                      <Route path="/contacts" element={<ContactsPage />} />
                      <Route path="/campaigns" element={<CampaignsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

