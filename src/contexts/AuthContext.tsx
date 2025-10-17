import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, Employee } from '../utils';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  path: string | null;
  login: (employeeId: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);

  // Improved session check - more flexible validation
  const hasValidStoredAuth = () => {
    try {
      const savedUser = localStorage.getItem('hrms_user');
      const savedEmployee = localStorage.getItem('hrms_employee');
      const savedCompany = localStorage.getItem('hrms_company');
      const savedToken = localStorage.getItem('hrms_token');
      
      // Check if we have the essential data
      if (!savedUser || !savedEmployee) {
        return false;
      }

      const userData = JSON.parse(savedUser);
      const employeeData = JSON.parse(savedEmployee);
      const companyData = savedCompany ? JSON.parse(savedCompany) : null;

      // Basic validation - check if required fields exist
      const hasValidUser = !!(userData && userData.id);
      const hasValidEmployee = !!(employeeData && employeeData.employeeId);
      
      return hasValidUser && hasValidEmployee;
    } catch (error) {
      console.error('Error checking stored auth:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (hasValidStoredAuth()) {
          const savedUser = localStorage.getItem('hrms_user');
          const savedEmployee = localStorage.getItem('hrms_employee');
          const savedCompany = localStorage.getItem('hrms_company');
          const savedToken = localStorage.getItem('hrms_token');
          const savedPath = localStorage.getItem('hrms_path');

          if (savedUser) setUser(JSON.parse(savedUser));
          if (savedEmployee) setEmployee(JSON.parse(savedEmployee));
          if (savedCompany) setCompany(JSON.parse(savedCompany));
          if (savedToken) setToken(savedToken);
          if (savedPath) setPath(savedPath);
          setIsAuthenticated(true);
        } else {
          // Clear any corrupted/incomplete data
          clearAuthData();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthData = () => {
    setUser(null);
    setEmployee(null);
    setCompany(null);
    setIsAuthenticated(false);
    setToken(null);
    setPath(null);
    
    // Clear all auth-related localStorage items
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_employee');
    localStorage.removeItem('hrms_company');
    localStorage.removeItem('hrms_cookies');
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_path');
  };

  const login = async (employeeId: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Make login request to n8n webhook
      const loginResponse = await fetch('https://n8n.gopocket.in/webhook/hrms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usr: employeeId,
          pwd: password
        })
      });

      const responseData = await loginResponse.json();
      console.log('Login response:', responseData);

      // Handle failed login response
      if (Array.isArray(responseData) && responseData.length > 0) {
        const firstItem = responseData[0];
        if (firstItem.status === "FAILED") {
          throw new Error('Wrong Backoffice password');
        }
      }

      if (!loginResponse.ok) {
        const errorMessage = responseData.message || responseData.exc || responseData.error || `Authentication failed with status ${loginResponse.status}`;
        throw new Error(errorMessage);
      }

      if (responseData.exc) {
        throw new Error('Invalid employee ID or password');
      }

      // Extract login data from response (could be array or object)
      const loginData = Array.isArray(responseData) ? responseData[0] : responseData;

      // Check if we have the required data in the response
      if (!loginData.employee && !loginData.first_name) {
        throw new Error('Wrong Backoffice password contact IT');
      }

      // Determine user role based on employee ID or designation
      let userRole: User['role'] = 'employee';
      if (employeeId === 'HR001' || employeeId === 'hr001') {
        userRole = 'admin';
      } else if (loginData.designation?.toLowerCase().includes('manager')) {
        userRole = 'manager';
      }

      // Create employee data from the API response
      const employeeData: Employee = {
        id: loginData.name,
        employeeId: loginData.employee,
        userId: loginData.user_id,
        companyId: (loginData.company || 'gopocket').toLowerCase().replace(/\s+/g, '-'),
        firstName: loginData.first_name,
        lastName: loginData.last_name || '',
        email: loginData.company_email || loginData.prefered_email,
        phone: loginData.cell_number,
        avatar: '/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png', // Default avatar
        department: loginData.department,
        designation: loginData.designation,
        joiningDate: loginData.date_of_joining,
        salary: 0, // Not provided in response
        status: loginData.status?.toLowerCase() === 'active' ? 'confirmed' : 'probation',
        address: loginData.current_address || '',
        token: loginData.token,
        path: loginData.path,
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create user data
      const userData: User = {
        id: loginData.user_id || loginData.name,
        employeeId: loginData.employee,
        email: loginData.company_email || loginData.prefered_email,
        firstName: loginData.first_name.split(' ')[0] || 'User',
        lastName: loginData.first_name.split(' ').slice(1).join(' ') || 'Name',
        role: userRole,
        companyId: employeeData.companyId,
        avatar: '/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png',
        isActive: loginData.status?.toLowerCase() === 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        token: loginData.token,
        path: loginData.path
      };

      // Create company data
      const companyData: Company = {
        id: employeeData.companyId,
        name: loginData.company || 'GoPocket',
        subdomain: 'gopocket',
        logo: '/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png',
        address: '123 Business St, Tech City, TC 12345',
        phone: '+1 (555) 123-4567',
        email: 'contact@gopocket.in',
        website: 'https://gopocket.in',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Set state
      setUser(userData);
      setEmployee(employeeData);
      setCompany(companyData);
      setIsAuthenticated(true);
      setToken(loginData.token || null);
      setPath(loginData.path || null);
      
      // Save to localStorage - this is critical for persistence
      localStorage.setItem('hrms_user', JSON.stringify(userData));
      localStorage.setItem('hrms_employee', JSON.stringify(employeeData));
      localStorage.setItem('hrms_company', JSON.stringify(companyData));
      localStorage.setItem('hrms_token', loginData.token || '');
      localStorage.setItem('hrms_path', loginData.path || '');
      
    } catch (error) {
      console.error('Login error:', error);
      clearAuthData();
      
      if (error instanceof Error) {
        throw error;
      } else if (typeof error === 'string') {
        throw new Error(error);
      } else {
        throw new Error('Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear server session if possible, but don't wait for it
    fetch('https://hrms-db.gopocket.in/api/method/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(console.error);
    
    // Immediately clear local data
    clearAuthData();
  };

  const switchRole = (role: string) => {
    if (user) {
      const updatedUser = { ...user, role: role as User['role'] };
      setUser(updatedUser);
      localStorage.setItem('hrms_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      employee,
      company,
      isAuthenticated,
      isLoading,
      token,
      path,
      login,
      logout,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};