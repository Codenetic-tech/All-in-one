
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import CRMDashboard from './components/CRMDashboard';
import LeadDetailsPage from './components/LeadDetailsPage';
import LoginForm from './components/Auth/LoginForm';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <Layout>{children}</Layout>;
};

// Add role-based redirection logic
const getDefaultRoute = (role: string | undefined) => {
  switch (role) {
    case 'banking':
      return '/segregation';
    default:
      return '/crm';
  }
};

const AppContent = () => {
  const { isAuthenticated, user } = useAuth(); // Add user to destructuring

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to={getDefaultRoute(user?.role)} /> : 
              <LoginForm />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* CRM Routes */}
        <Route 
          path="/crm" 
          element={
            <ProtectedRoute>
              <CRMDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/crm/leads/:leadId" 
          element={
            <ProtectedRoute>
              <LeadDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? getDefaultRoute(user?.role) : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
