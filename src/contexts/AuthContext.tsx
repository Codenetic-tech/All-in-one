import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, Employee } from '../utils';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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

  // Simple session check - just verify we have valid stored data
  const hasValidStoredAuth = () => {
    try {
      const savedUser = localStorage.getItem('hrms_user');
      const savedEmployee = localStorage.getItem('hrms_employee');
      const savedCompany = localStorage.getItem('hrms_company');
      
      if (!savedUser || !savedEmployee || !savedCompany) {
        return false;
      }

      const userData = JSON.parse(savedUser);
      const employeeData = JSON.parse(savedEmployee);
      const companyData = JSON.parse(savedCompany);

      // Basic validation - check if required fields exist
      return !!(userData && userData.id && employeeData && employeeData.employeeId);
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

          if (savedUser) setUser(JSON.parse(savedUser));
          if (savedEmployee) setEmployee(JSON.parse(savedEmployee));
          if (savedCompany) setCompany(JSON.parse(savedCompany));
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
    
    // Clear all auth-related localStorage items
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_employee');
    localStorage.removeItem('hrms_company');
    localStorage.removeItem('hrms_cookies');
  };

  const login = async (employeeId: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Make login request
      const loginResponse = await fetch('https://hrms-db.gopocket.in/api/method/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          usr: employeeId,
          pwd: password
        })
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (!loginResponse.ok) {
        const errorMessage = loginData.message || loginData.exc || loginData.error || `Authentication failed with status ${loginResponse.status}`;
        throw new Error(errorMessage);
      }

      if (loginData.exc) {
        throw new Error('Invalid employee ID or password');
      }

      // Try to get employee data from webhook, but don't fail if it doesn't work
      let employeeData = null;
      try {
        const webhookResponse = await fetch('https://n8n.gopocket.in/webhook/hrms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usr: employeeId,
            pwd: password
          })
        });

        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json();
          console.log('n8n webhook response:', webhookData);
          
          if (Array.isArray(webhookData) && webhookData.length > 0) {
            const empData = webhookData[0];
            const avatarUrl = empData.image 
              ? (empData.image.startsWith('http') 
                  ? empData.image 
                  : `https://hrms-db.gopocket.in${empData.image}`)
              : undefined;
            
            employeeData = {
              id: empData.name,
              employeeId: empData.employee,
              userId: empData.name,
              companyId: empData.company?.toLowerCase().replace(/\s+/g, '-') || 'gopocket',
              firstName: empData.first_name,
              lastName: empData.last_name || '',
              email: empData.company_email || empData.personal_email,
              phone: empData.cell_number,
              avatar: avatarUrl,
              department: empData.department,
              designation: empData.designation,
              joiningDate: empData.date_of_joining,
              salary: empData.ctc || 0,
              status: empData.status?.toLowerCase() === 'active' ? 'confirmed' : 'probation',
              address: '',
              emergencyContact: {
                name: empData.person_to_be_contacted || '',
                phone: empData.emergency_phone_number || '',
                relationship: empData.relation || ''
              },
              documents: [],
              createdAt: empData.creation,
              updatedAt: empData.modified
            } as Employee;
          }
        }
      } catch (webhookError) {
        console.warn('Webhook call failed, continuing with basic user data:', webhookError);
      }

      // Determine user role
      let userRole: User['role'] = 'employee';
      if (employeeId === 'HR001' || employeeId === 'hr001') {
        userRole = 'admin';
      } else if (employeeData?.designation?.toLowerCase().includes('manager')) {
        userRole = 'manager';
      }

      // Create user data
      const userData: User = {
        id: loginData.message?.user_id || employeeData?.id || `user-${Date.now()}`,
        employeeId: employeeId,
        email: employeeData?.email || `${employeeId}@gopocket.in`,
        firstName: employeeData?.firstName || loginData.message?.first_name || loginData.full_name?.split(' ')[0] || 'User',
        lastName: employeeData?.lastName || loginData.message?.last_name || loginData.full_name?.split(' ').slice(1).join(' ') || 'Name',
        role: userRole,
        companyId: employeeData?.companyId || 'gopocket',
        avatar: employeeData?.avatar || '/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png',
        isActive: true,
        createdAt: employeeData?.createdAt || new Date().toISOString(),
        updatedAt: employeeData?.updatedAt || new Date().toISOString()
      };

      // Create company data
      const companyData: Company = {
        id: employeeData?.companyId || 'gopocket',
        name: employeeData?.companyId === 'gopocket' ? 'GoPocket' : 'Company Name',
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
      
      // Save to localStorage - this is critical for persistence
      localStorage.setItem('hrms_user', JSON.stringify(userData));
      if (employeeData) {
        localStorage.setItem('hrms_employee', JSON.stringify(employeeData));
      }
      localStorage.setItem('hrms_company', JSON.stringify(companyData));

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
      login,
      logout,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};