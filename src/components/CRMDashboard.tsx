import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Mail, Phone, Calendar, Filter, Search, Download, 
  Plus, MoreVertical, Eye, Edit, Trash2, ChevronDown,
  Building2, User, MailIcon, PhoneIcon, MessageCircle,
  Activity, CheckSquare, FileText, ArrowUpRight, ArrowDownRight,
  IndianRupee, RefreshCw, TrendingUp, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Wifi, WifiOff,
  BookText,
  CalendarCheck
} from 'lucide-react';

// Import the actual useAuth hook and fetchLeads function
import { useAuth } from '@/contexts/AuthContext';
import { fetchLeads, refreshLeads, type Lead, clearAllCache } from '@/utils/crm';
import { PathBreadcrumb } from './PathBreadcrumb';
import { SummaryCard, SummaryCardsGrid } from './SummaryCard';
import { AddLeadDialog } from './AddLeadDialog';

interface SummaryData {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  followup: number;
  qualifiedLeads: number;
  totalValue: number;
  conversionRate: number;
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'Contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-800' },
  { value: 'followup', label: 'Followup', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
  { value: 'Not Interested', label: 'Not Interested', color: 'bg-red-100 text-red-800' },
  { value: 'Call Back', label: 'Call Back', color: 'bg-orange-100 text-orange-800' },
  { value: 'Switch off', label: 'Switch off', color: 'bg-gray-100 text-gray-800' },
  { value: 'RNR', label: 'RNR', color: 'bg-indigo-100 text-indigo-800' },
];

const CRMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get actual user from auth context
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' }>({ 
    key: 'createdAt', 
    direction: 'desc' 
  });
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(900); // 15 minutes in seconds
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');
  const [newRecordsCount, setNewRecordsCount] = useState(0);
  const [modifiedRecordsCount, setModifiedRecordsCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);

  // Bulk action state
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Refs
  const lastFetchedData = useRef<Lead[]>([]);
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get actual user credentials from auth context
  const employeeId = user?.employeeId || '';
  const email = user?.email || '';
  const teamMembers = user?.team ? JSON.parse(user.team) : [];

  // Function to change lead status
  const changeLeadStatus = async (leadId: string, newStatus: string, leadName: string) => {
    setIsChangingStatus(leadId);
    setOpenDropdown(null);
    
    try {
      // Send request to webhook
      const response = await fetch('https://n8n.gopocket.in/webhook/hrms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'Statuschange',
          name: leadName,
          status: newStatus,
          leadId: leadId,
          employeeId: employeeId,
          email: email,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Status change response:', result);

      // Update local state if webhook call was successful
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, status: newStatus as Lead['status'] }
            : lead
        )
      );

      // Show success feedback
      console.log(`Status changed to ${newStatus} for lead: ${leadName}`);
      
    } catch (error: any) {
      console.error('Error changing lead status:', error);
      setError(`Failed to change status: ${error.message}`);
      
      // Revert the status change in UI if the API call failed
      // You might want to show a toast notification here instead
    } finally {
      setIsChangingStatus(null);
      handleClearCacheAndRefresh();
    }
  };

  // Bulk action functions
  const toggleLeadSelection = (leadId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === currentLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentLeads.map(lead => lead.id));
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedTeamMember || selectedLeads.length === 0) return;
    
    setIsAssigning(true);
    try {
      const response = await fetch('https://n8n.gopocket.in/webhook/hrms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctype: "CRM Lead",
          name: JSON.stringify(selectedLeads),
          assign_to: [selectedTeamMember],
          bulk_assign: true,
          re_assign: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Bulk assign response:', result);

      // Clear selection and close bulk actions
      setSelectedLeads([]);
      setSelectedTeamMember('');

      // Refresh leads to show updated assignments
      handleClearCacheAndRefresh();

    } catch (error: any) {
      console.error('Error in bulk assignment:', error);
      setError(`Failed to assign leads: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  // Bulk Actions Bar Component
  const BulkActionsBar = () => {
    if (selectedLeads.length === 0) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-blue-800 font-medium">
              {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
            </span>
            
            <select
              value={selectedTeamMember}
              onChange={(e) => setSelectedTeamMember(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select team member</option>
              {teamMembers.map((member: string) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>

            <button
              onClick={handleBulkAssign}
              disabled={!selectedTeamMember || isAssigning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAssigning ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Users size={16} />
              )}
              Assign Selected
            </button>
          </div>

          <button
            onClick={() => setSelectedLeads([])}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      </div>
    );
  };

  // Fetch all leads using the actual fetchLeads function
  const fetchAllLeads = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
        setConnectionStatus('syncing');
      } else {
        setIsInitialLoading(true);
      }
      
      setError(null);
      
      // Use the actual fetchLeads function that sends employeeId and email to webhook
      const apiLeads = await fetchLeads(employeeId, email, user.team);
      
      if (isAutoRefresh && lastFetchedData.current.length > 0) {
        // Incremental update for auto-refresh
        const currentDataMap = new Map(lastFetchedData.current.map(lead => [lead.id, getLeadContentHash(lead)]));
        const newDataMap = new Map(apiLeads.map(lead => [lead.id, getLeadContentHash(lead)]));
        
        let newCount = 0;
        let modifiedCount = 0;
        
        // Start with clean data (no flags)
        const cleanCurrentData = lastFetchedData.current.map(lead => ({
          ...lead,
          _isNew: false,
          _isModified: false
        }));
        
        // Create a map of current data by ID
        const currentDataById = new Map(cleanCurrentData.map(lead => [lead.id, lead]));
        
        // Process new data
        const updatedLeads: Lead[] = [];
        
        apiLeads.forEach(newLead => {
          const leadId = newLead.id;
          const newContentHash = newDataMap.get(leadId);
          const oldContentHash = currentDataMap.get(leadId);
          const existingLead = currentDataById.get(leadId);
          
          if (!existingLead) {
            // New lead
            newLead._isNew = true;
            updatedLeads.push(newLead);
            newCount++;
            console.log('New lead detected:', newLead);
          } else if (oldContentHash !== newContentHash) {
            // Modified lead
            newLead._isModified = true;
            updatedLeads.push(newLead);
            modifiedCount++;
            console.log('Modified lead detected:', { old: existingLead, new: newLead });
          } else {
            // Unchanged lead
            updatedLeads.push(existingLead);
          }
        });
        
        // Sort by creation date (newest first)
        updatedLeads.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        
        setLeads(updatedLeads);
        lastFetchedData.current = updatedLeads.map(lead => ({
          ...lead,
          _isNew: false,
          _isModified: false
        }));
        
        setNewRecordsCount(newCount);
        setModifiedRecordsCount(modifiedCount);
        
        console.log(`Auto-refresh completed: ${newCount} new, ${modifiedCount} modified, ${updatedLeads.length} total`);
        
        // Clear new/modified flags after 5 seconds
        setTimeout(() => {
          setLeads(prev => prev.map(lead => ({
            ...lead,
            _isNew: false,
            _isModified: false
          })));
        }, 5000);
        
        setConnectionStatus('connected');
      } else {
        // Full refresh for initial load
        const sortedLeads = apiLeads.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        
        setLeads(sortedLeads);
        lastFetchedData.current = sortedLeads;
        setNewRecordsCount(0);
        setModifiedRecordsCount(0);
        setConnectionStatus('connected');
        console.log('Full refresh completed:', sortedLeads.length, 'leads');
      }
      
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      setError(`Failed to fetch leads: ${error.message}`);
      setConnectionStatus('disconnected');
    } finally {
      setIsInitialLoading(false);
      setIsAutoRefreshing(false);
    }
  };

  // Helper function to get lead content hash for comparison
  const getLeadContentHash = (lead: Lead): string => {
    const keys: (keyof Lead)[] = ['name', 'email', 'phone', 'company', 'status', 'value', 'assignedTo', 'lastActivity'];
    return keys.map(key => String(lead[key] || '')).join('|');
  };

  // Load data on mount
  useEffect(() => {
    if (employeeId && email) {
      fetchAllLeads(false);
    }
  }, [employeeId, email]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshTimeoutRef.current) {
      clearTimeout(autoRefreshTimeoutRef.current);
    }
    
    if (autoRefresh && !isInitialLoading && employeeId && email) {
      const scheduleNextRefresh = () => {
        autoRefreshTimeoutRef.current = setTimeout(() => {
          handleClearCacheAndRefresh().finally(() => {
            scheduleNextRefresh();
          });
        }, refreshInterval * 1000);
      };
      
      scheduleNextRefresh();
    }
    
    return () => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, isInitialLoading, employeeId, email]);

  // Calculate summary data - start with 0 for initial state
  const summaryData: SummaryData = useMemo(() => {
    if (isInitialLoading && leads.length === 0) {
      return {
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        followup: 0,
        qualifiedLeads: 0,
        totalValue: 0,
        conversionRate: 0
      };
    }

    return {
      totalLeads: leads.length,
      newLeads: leads.filter(lead => lead.status === 'new').length,
      contactedLeads: leads.filter(lead => lead.status === 'Contacted').length,
      followup: leads.filter(lead => lead.status === 'followup').length,
      qualifiedLeads: leads.filter(lead => lead.status === 'qualified').length,
      totalValue: leads.reduce((sum, lead) => sum + lead.value, 0),
      conversionRate: Math.round((leads.filter(lead => ['qualified', 'negotiation', 'won'].includes(lead.status)).length / Math.max(leads.length, 1)) * 100)
    };
  }, [leads, isInitialLoading]);

  // Filter and sort leads
  useEffect(() => {
    let result = leads;

    result = result.filter(lead => 
    ['new', 'Contacted', 'qualified', 'followup', 'Not Interested', 'Call Back', 'Switch off', 'RNR'].includes(lead.status)
  );

    if (searchTerm) {
      result = result.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.source && lead.source.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(lead => lead.status === statusFilter);
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'createdAt') {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();
          
          if (aDate < bDate) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aDate > bDate) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredLeads(result);
    setCurrentPage(1);
  }, [leads, searchTerm, statusFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  const handleSort = (key: keyof Lead) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    if (key === 'createdAt' && !sortConfig) {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      Contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      followup: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800',
      'Not Interested': 'bg-red-100 text-red-800',
      'Call Back': 'bg-orange-100 text-orange-800',
      'Switch off': 'bg-gray-100 text-gray-800',
      'RNR': 'bg-indigo-100 text-indigo-800'
    };
    return colors[status];
  };

  const handleLeadClick = (leadId: string) => {
    // Don't navigate if user was selecting leads
    if (selectedLeads.length === 0) {
      navigate(`/crm/leads/${leadId}`);
    }
  };

  const handleClearCacheAndRefresh = async () => {
    if (!employeeId || !email) return;
    
    // Clear cache and force refresh from API
    clearAllCache();
    await refreshLeads(employeeId, email, user.team);
    await fetchAllLeads(false);
  };

  const handleLeadAdded = () => {
    // Refresh the leads list after adding a new lead
    handleClearCacheAndRefresh();
  };

  const toggleDropdown = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === leadId ? null : leadId);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const Pagination = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length} leads</span>
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft size={16} />
          </button>
          
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full p-6">
  
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              {/* Path Breadcrumb */}
               <PathBreadcrumb />
              {getConnectionStatusIcon()}
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-4 mt-1 text-sm">
                {(newRecordsCount > 0 || modifiedRecordsCount > 0) && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {newRecordsCount > 0 && `${newRecordsCount} new`}
                    {newRecordsCount > 0 && modifiedRecordsCount > 0 && ', '}
                    {modifiedRecordsCount > 0 && `${modifiedRecordsCount} updated`}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700">Auto Refresh</label>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={60}>1 min</option>
              <option value={300}>5 min</option>
              <option value={600}>10 min</option>
              <option value={900}>15 min</option>
            </select>
            <button 
              onClick={handleClearCacheAndRefresh}
              disabled={isInitialLoading || isAutoRefreshing}
              className="px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={18} className={isInitialLoading || isAutoRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <AddLeadDialog onLeadAdded={handleLeadAdded} />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-8">
           <h1 className="text-3xl font-bold text-foreground">Lead Management</h1>
        </div>

        {/* Summary Cards */}
        <SummaryCardsGrid columns={5} className="mb-6">
          <SummaryCard
            title="Total Leads" value={summaryData.totalLeads} icon={Users} color="blue" shadowColor="blue" trend={{ value: 12.5, isPositive: true }} showTrend={true} />
          
          <SummaryCard
            title="New Leads" value={summaryData.newLeads} icon={User} color="green" shadowColor="green" trend={{ value: 8.2, isPositive: true }} showTrend={true} />
          
          <SummaryCard
            title="Contacted Leads" value={summaryData.contactedLeads} icon={BookText} color="orange" shadowColor="orange" trend={{ value: 22.1, isPositive: true }} 
            showTrend={true} />

          <SummaryCard
            title="Followup" value={summaryData.followup} icon={CalendarCheck} color="yellow" shadowColor="yellow" trend={{ value: 22.1, isPositive: true }} 
            showTrend={true} />
          
          <SummaryCard
            title="Qualified Leads" value={summaryData.qualifiedLeads} icon={CheckSquare} color="purple" shadowColor="purple" trend={{ value: 15.3, isPositive: true }} showTrend={true} />
        </SummaryCardsGrid>
        
        {/* Bulk Actions Bar */}
        <BulkActionsBar />
        
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search leads by name, company, email, phone, city, or source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                 <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="followup">Followup</option>
                  <option value="qualified">Qualified</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Call Back">Call Back</option>
                  <option value="Switch off">Switch off</option>
                  <option value="RNR">RNR</option> 
             </select>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Filter size={18} />
                More Filters
              </button>
              <button className="px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Download size={18} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === currentLeads.length && currentLeads.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Lead Name
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform ${
                          sortConfig?.key === 'name' && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Campaign</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">City</th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform ${
                          sortConfig?.key === 'status' && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('value')}
                  >
                    <div className="flex items-center gap-2">
                      Last Modified
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform ${
                          sortConfig?.key === 'value' && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform ${
                          sortConfig?.key === 'createdAt' && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isInitialLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12">
                      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
                      <p className="text-gray-600">Loading leads from API...</p>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12">
                      <div className="text-gray-400 mb-2">No leads available</div>
                      <p className="text-gray-600">Start by adding your first lead</p>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12">
                      <div className="text-gray-400 mb-2">No matching records found</div>
                      <p className="text-gray-600">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  currentLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        lead._isNew ? 'bg-green-50 border-l-4 border-green-400' : 
                        lead._isModified ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                      }`}
                      onClick={() => handleLeadClick(lead.id)}
                    >
                      <td 
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{lead.name}</p>
                            {lead.ucc && (
                              <p className="text-xs text-gray-400">UCC: {lead.ucc}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{lead.source}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{lead.campaign}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <PhoneIcon size={14} className="text-gray-400" />
                            <span className="text-gray-900">{lead.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-gray-400" />
                            <span className="text-gray-900">{lead.city}</span>
                          </div>
                          {lead.branchCode && (
                            <div className="text-xs text-gray-400">
                              Branch: {lead.branchCode}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-gray-900">{lead.lastActivity}</span>
                        </div>
                      </td>
                     <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {JSON.parse(lead._assign || "[]")
                          .filter(
                            (user) =>
                              user !== "gokul.krishna.687@gopocket.in"
                          )
                          .map((user, index) => {
                            const firstLetter = user.charAt(0).toUpperCase();
                            return (
                              <div key={index} className="relative group">
                                {/* Circle with first letter */}
                                <div
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white text-sm font-semibold border-2 border-white cursor-pointer"
                                  title={user}
                                >
                                  {firstLetter}
                                </div>

                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg z-10">
                                  {user}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{new Date(lead.createdAt).toLocaleDateString('en-GB')}</p>
                          {lead.firstRespondedOn && (
                            <p className="text-xs text-gray-400">
                              First response: {new Date(lead.firstRespondedOn).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button 
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              onClick={(e) => toggleDropdown(lead.id, e)}
                              disabled={isChangingStatus === lead.id}
                            >
                              {isChangingStatus === lead.id ? (
                                <RefreshCw size={18} className="animate-spin" />
                              ) : (
                                <MoreVertical size={18} />
                              )}
                            </button>
                            
                            {openDropdown === lead.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                                  Change Status
                                </div>
                                {statusOptions.map((status) => (
                                  <button
                                    key={status.value}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${
                                      lead.status === status.value ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeLeadStatus(lead.id, status.value, lead.name);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`} />
                                      <span>{status.label}</span>
                                    </div>
                                    {lead.status === status.value && (
                                      <Check size={16} className="text-blue-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isInitialLoading && leads.length > 0 && <Pagination />}
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;