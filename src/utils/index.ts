
// Core types for the HRMS system
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'hr' | 'manager' | 'employee';
  companyId: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employeeId: string;
}

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  timezone: string;
  currency: string;
  subscriptionPlan: 'trial' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  userId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  status: 'probation' | 'confirmed' | 'resigned' | 'terminated';
  managerId?: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents: {
    id: string;
    type: string;
    url: string;
    uploadedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  companyId: string;
  type: 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComments?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  companyId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked: number;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'early-leave';
  notes?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headId?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Designation {
  id: string;
  title: string;
  department: string;
  level: number;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'hr' | 'payroll' | 'leave' | 'other';
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
