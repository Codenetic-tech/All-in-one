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

interface CachedCommentsData {
  [leadId: string]: {
    comments: Comment[];
    timestamp: number;
  };
}

const COMMENTS_CACHE_KEY = 'crm_comments_cache';

export interface Comment {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  comment_type: string;
  comment_email: string;
  subject: string | null;
  comment_by: string;
  published: number;
  seen: number;
  reference_doctype: string;
  reference_name: string;
  reference_owner: string | null;
  content: string;
  ip_address: string | null;
  doctype?: string;
}

export const getCachedComments = (leadId: string): Comment[] | null => {
  try {
    const cached = localStorage.getItem(COMMENTS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedCommentsData = JSON.parse(cached);
    const commentCache = cachedData[leadId];
    
    if (!commentCache) return null;
    
    const isExpired = Date.now() - commentCache.timestamp > CACHE_DURATION;
    if (isExpired) {
      delete cachedData[leadId];
      localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cachedData));
      return null;
    }

    return commentCache.comments;
  } catch (error) {
    console.error('Error reading comments cache:', error);
    return null;
  }
};

export const saveCommentsToCache = (leadId: string, comments: Comment[]): void => {
  try {
    const cached = localStorage.getItem(COMMENTS_CACHE_KEY);
    const cachedData: CachedCommentsData = cached ? JSON.parse(cached) : {};
    
    cachedData[leadId] = {
      comments,
      timestamp: Date.now()
    };
    
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error saving comments to cache:', error);
  }
};

export const clearCommentsCache = (): void => {
  localStorage.removeItem(COMMENTS_CACHE_KEY);
};

export const getCacheInfo = () => {
  try {
    const leadsCache = localStorage.getItem(LEADS_CACHE_KEY);
    const detailsCache = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    const commentsCache = localStorage.getItem(COMMENTS_CACHE_KEY);
    
    const leadsData = leadsCache ? JSON.parse(leadsCache) : null;
    const detailsData = detailsCache ? JSON.parse(detailsCache) : null;
    const commentsData = commentsCache ? JSON.parse(commentsCache) : null;
    
    return {
      hasLeadsCache: !!leadsCache,
      hasDetailsCache: !!detailsCache,
      hasCommentsCache: !!commentsCache,
      leadsCount: leadsData ? leadsData.leads.length : 0,
      detailsCount: detailsData ? Object.keys(detailsData).length : 0,
      commentsCount: commentsData ? Object.keys(commentsData).length : 0,
      leadsTimestamp: leadsData ? leadsData.timestamp : null,
      detailsTimestamp: detailsData ? Math.max(...Object.values(detailsData).map((d: any) => d.timestamp)) : null,
      commentsTimestamp: commentsData ? Math.max(...Object.values(commentsData).map((c: any) => c.timestamp)) : null
    };
  } catch {
    return {
      hasLeadsCache: false,
      hasDetailsCache: false,
      hasCommentsCache: false,
      leadsCount: 0,
      detailsCount: 0,
      commentsCount: 0,
      leadsTimestamp: null,
      detailsTimestamp: null,
      commentsTimestamp: null
    };
  }
};