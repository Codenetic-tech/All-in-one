// utils/crmCache.ts
import { type Lead } from '@/utils/crm';

interface CachedLeadData {
  leads: Lead[];
  timestamp: number;
  employeeId: string;
  email: string;
}

interface CachedLeadDetails {
  [leadId: string]: {
    lead: Lead;
    timestamp: number;
  };
}

const LEADS_CACHE_KEY = 'crm_leads_cache';
const LEAD_DETAILS_CACHE_KEY = 'crm_lead_details_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const getCachedLeads = (employeeId: string, email: string): Lead[] | null => {
  try {
    const cached = localStorage.getItem(LEADS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedLeadData = JSON.parse(cached);
    const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION;
    const isSameUser = cachedData.employeeId === employeeId && cachedData.email === email;

    if (isExpired || !isSameUser) {
      localStorage.removeItem(LEADS_CACHE_KEY);
      return null;
    }

    return cachedData.leads;
  } catch (error) {
    console.error('Error reading leads cache:', error);
    return null;
  }
};

export const saveLeadsToCache = (leads: Lead[], employeeId: string, email: string): void => {
  try {
    const cacheData: CachedLeadData = {
      leads,
      timestamp: Date.now(),
      employeeId,
      email
    };
    localStorage.setItem(LEADS_CACHE_KEY, JSON.stringify(cacheData));

    // Also save each lead to the lead details cache
    const cachedDetails = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    const detailsCache: CachedLeadDetails = cachedDetails ? JSON.parse(cachedDetails) : {};
    const now = Date.now();
    leads.forEach(lead => {
      detailsCache[lead.id] = {
        lead,
        timestamp: now
      };
    });
    localStorage.setItem(LEAD_DETAILS_CACHE_KEY, JSON.stringify(detailsCache));
  } catch (error) {
    console.error('Error saving leads to cache:', error);
  }
};

export const getCachedLeadDetails = (leadId: string): Lead | null => {
  try {
    const cached = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedLeadDetails = JSON.parse(cached);
    const leadCache = cachedData[leadId];
    
    if (!leadCache) return null;
    
    const isExpired = Date.now() - leadCache.timestamp > CACHE_DURATION;
    if (isExpired) {
      delete cachedData[leadId];
      localStorage.setItem(LEAD_DETAILS_CACHE_KEY, JSON.stringify(cachedData));
      return null;
    }

    return leadCache.lead;
  } catch (error) {
    console.error('Error reading lead details cache:', error);
    return null;
  }
};

export const saveLeadDetailsToCache = (leadId: string, lead: Lead): void => {
  try {
    const cached = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    const cachedData: CachedLeadDetails = cached ? JSON.parse(cached) : {};
    
    cachedData[leadId] = {
      lead,
      timestamp: Date.now()
    };
    
    localStorage.setItem(LEAD_DETAILS_CACHE_KEY, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error saving lead details to cache:', error);
  }
};

export const clearAllCache = (): void => {
  localStorage.removeItem(LEADS_CACHE_KEY);
  localStorage.removeItem(LEAD_DETAILS_CACHE_KEY);
};

export const clearLeadDetailsCache = (): void => {
  localStorage.removeItem(LEAD_DETAILS_CACHE_KEY);
};

export const getCacheInfo = () => {
  try {
    const leadsCache = localStorage.getItem(LEADS_CACHE_KEY);
    const detailsCache = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    
    const leadsData = leadsCache ? JSON.parse(leadsCache) : null;
    const detailsData = detailsCache ? JSON.parse(detailsCache) : null;
    
    return {
      hasLeadsCache: !!leadsCache,
      hasDetailsCache: !!detailsCache,
      leadsCount: leadsData ? leadsData.leads.length : 0,
      detailsCount: detailsData ? Object.keys(detailsData).length : 0,
      leadsTimestamp: leadsData ? leadsData.timestamp : null,
      detailsTimestamp: detailsData ? Math.max(...Object.values(detailsData).map((d: any) => d.timestamp)) : null
    };
  } catch {
    return {
      hasLeadsCache: false,
      hasDetailsCache: false,
      leadsCount: 0,
      detailsCount: 0,
      leadsTimestamp: null,
      detailsTimestamp: null
    };
  }
};