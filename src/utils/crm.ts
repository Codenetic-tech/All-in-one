import { useAuth } from '@/contexts/AuthContext';

// services/crm.ts
export interface APILead {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  lead_owner: string;
  first_name: string;
  email: string;
  mobile_no: string;
  naming_series: string;
  lead_name: string;
  issue: string;
  status: string;
  no_of_employees: string;
  annual_revenue: number;
  image: string;
  converted: number;
  lead_source: string;
  ucc?: string;
  referredby?: string;
  nse_cm?: string;
  nse_cd?: string;
  bse_fo?: string;
  city?: string;
  pannumber?: string;
  branch_code?: string;
  mcx_co?: string;
  nse_fo?: string;
  bse_cm?: string;
  tradedone?: string;
  state?: string;
  total: number;
  net_total: number;
  sla_status: string;
  communication_status: string;
  first_response_time?: number;
  first_responded_on?: string;
  doctype: string;
  assigned?: string;
  industry?: string;
  notes?: string;
  campaign?: string;
  _assign: string;
  language: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'Contacted' | 'qualified' | 'followup' | 'negotiation' | 'won' | 'lost' | 'Not Interested' | 'Call Back' | 'Switch off' | 'RNR';
  source: string;
  value: number;
  createdAt: string;
  assignedTo: string;
  lastActivity: string;
  industry: string;
  notes: string;
  // Additional fields from API
  ucc?: string;
  referredBy?: string;
  city?: string;
  state?: string;
  panNumber?: string;
  branchCode?: string;
  tradeDone?: string;
  nseCm?: string;
  nseCd?: string;
  bseFo?: string;
  mcxCo?: string;
  nseFo?: string;
  bseCm?: string;
  noOfEmployees?: string;
  communicationStatus?: string;
  firstResponseTime?: number;
  firstRespondedOn?: string;
  _isNew?: boolean;
  _isModified?: boolean;
  campaign?: string;
  _assign: string;
  language: string;
}

// Import cache functions
import { 
  getCachedLeads, 
  saveLeadsToCache, 
  getCachedLeadDetails, 
  saveLeadDetailsToCache,
  clearAllCache,
  getCachedTasks,
  saveTasksToCache,
  clearTasksCache,
  clearTasksCacheForLead,
  type Task 
} from '@/utils/crmCache';

// Function to map API status to our status
const mapApiStatus = (apiStatus: string): Lead['status'] => {
  const statusMap: { [key: string]: Lead['status'] } = {
    'New': 'new',
    'Contacted': 'Contacted',
    'Qualified': 'qualified',
    'Followup': 'followup',
    'Negotiation': 'negotiation',
    'Won': 'won',
    'Lost': 'lost',
    'Client': 'won',
    'Not Interested': 'Not Interested',
    'Call Back': 'Call Back',
    'Switch off': 'Switch off',
    'RNR': 'RNR'
  };
  return statusMap[apiStatus] || 'new';
};

// Function to calculate time ago
const getTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  } catch {
    return 'Recently';
  }
};

// Function to map API lead to our Lead interface
export const mapApiLeadToLead = (apiLead: APILead): Lead => {
  return {
    id: apiLead.name,
    name: apiLead.lead_name || apiLead.first_name || 'Unknown',
    email: apiLead.email || 'No email',
    phone: apiLead.mobile_no || 'No phone',
    company: apiLead.city || apiLead.lead_source || 'Unknown Company',
    status: mapApiStatus(apiLead.status),
    source: apiLead.lead_source || 'Unknown',
    value: apiLead.annual_revenue || 0,
    createdAt: apiLead.creation,
    assignedTo: apiLead._assign || apiLead.lead_owner || 'Unassigned',
    lastActivity: getTimeAgo(apiLead.modified),
    industry: apiLead.lead_source || 'General',
    notes: apiLead.issue || 'No notes available',
    ucc: apiLead.ucc,
    referredBy: apiLead.referredby,
    city: apiLead.city,
    state: apiLead.state,
    panNumber: apiLead.pannumber,
    branchCode: apiLead.branch_code,
    tradeDone: apiLead.tradedone,
    nseCm: apiLead.nse_cm,
    nseCd: apiLead.nse_cd,
    bseFo: apiLead.bse_fo,
    mcxCo: apiLead.mcx_co,
    nseFo: apiLead.nse_fo,
    bseCm: apiLead.bse_cm,
    noOfEmployees: apiLead.no_of_employees,
    communicationStatus: apiLead.communication_status,
    firstResponseTime: apiLead.first_response_time,
    firstRespondedOn: apiLead.first_responded_on,
    campaign: apiLead.campaign,
    _assign: apiLead._assign,
    language: apiLead.language

  };
};

// Change the fetchLeads function to accept team parameter
export const fetchLeads = async (employeeId: string, email: string, team: string): Promise<Lead[]> => {
  // Check cache first
  const cachedLeads = getCachedLeads(employeeId, email);
  if (cachedLeads) {
    console.log('Returning cached leads');
    return cachedLeads;
  }

  try {
    console.log('Fetching leads from API...');
    const response = await fetch('https://n8n.gopocket.in/webhook/hrms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'Lead',
        employeeId: employeeId,
        email: email,
        team: team // Use the team parameter here instead of user.team
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch leads: ${response.status}`);
    }

    const apiLeads: APILead[] = await response.json();
    
    // Map API leads to our Lead interface
    const mappedLeads: Lead[] = apiLeads.map(mapApiLeadToLead);
    
    // Save to cache
    saveLeadsToCache(mappedLeads, employeeId, email);
    
    return mappedLeads;
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

// Update getLeadById to accept team parameter
export const getLeadById = async (leadId: string, employeeId: string, email: string, team: string): Promise<Lead | null> => {
  try {
    // Check cache first
    const cachedLead = getCachedLeadDetails(leadId);
    if (cachedLead) {
      console.log('Returning cached lead details');
      return cachedLead;
    }

    // If not in cache, fetch from API
    const leads = await fetchLeads(employeeId, email, team);
    const lead = leads.find(lead => lead.id === leadId) || null;
    
    // Save to cache if found
    if (lead) {
      saveLeadDetailsToCache(leadId, lead);
    }
    
    return lead;
  } catch (error) {
    console.error('Error getting lead by ID:', error);
    return null;
  }
};

// Update refreshLeads to accept team parameter
export const refreshLeads = async (employeeId: string, email: string, team: string): Promise<Lead[]> => {
  // Clear cache
  clearAllCache();
  return fetchLeads(employeeId, email, team);
};

// Update lead status
export const updateLeadStatus = (leadId: string, newStatus: Lead['status']): void => {
  try {
    // Update leads cache
    const leadsCache = localStorage.getItem('crm_leads_cache');
    if (leadsCache) {
      const cachedData = JSON.parse(leadsCache);
      const updatedLeads = cachedData.data.map((lead: Lead) =>
        lead.id === leadId 
          ? { ...lead, status: newStatus, lastActivity: 'Just now' }
          : lead
      );
      cachedData.data = updatedLeads;
      localStorage.setItem('crm_leads_cache', JSON.stringify(cachedData));
    }

    // Update lead details cache
    const detailsCache = localStorage.getItem('crm_lead_details_cache');
    if (detailsCache) {
      const cachedData = JSON.parse(detailsCache);
      if (cachedData[leadId]) {
        cachedData[leadId].lead.status = newStatus;
        cachedData[leadId].lead.lastActivity = 'Just now';
        localStorage.setItem('crm_lead_details_cache', JSON.stringify(cachedData));
      }
    }
  } catch (error) {
    console.error('Error updating lead status:', error);
  }
};

// Re-export cache functions
export { clearAllCache, getCacheInfo } from '@/utils/crmCache';

