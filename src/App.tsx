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
import { Sparkles } from 'lucide-react';
import Incentive from './components/management';
import Tickets from './components/tickets';

const queryClient = new QueryClient();

// Coming Soon component for new routes
const ComingSoon = () => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
      <p className="text-gray-600 max-w-md">
        This page is under development and will be available shortly.
      </p>
    </div>
  </div>
);

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
        
        {/* New Routes from Sidebar */}
        <Route 
          path="/realtime" 
          element={
            <ProtectedRoute>
              <ComingSoon />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client" 
          element={
            <ProtectedRoute>
              <Incentive />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/incentive" 
          element={
            <ProtectedRoute>
              <Incentive/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tickets" 
          element={
            <ProtectedRoute>
              <Tickets />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <ComingSoon />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contest" 
          element={
            <ProtectedRoute>
              <ComingSoon />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/task" 
          element={
            <ProtectedRoute>
              <ComingSoon />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hrms" 
          element={
            <ProtectedRoute>
              <ComingSoon />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/announcement" 
          element={
            <ProtectedRoute>
              <ComingSoon />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <ComingSoon />
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