// pages/CRMAnalyticsDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, User, BookText, CalendarCheck, CheckSquare, TrendingUp, BarChart3, Activity, RefreshCw, Wifi, WifiOff, Download, Filter, ChevronsUpDown, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchLeads, refreshLeads, type Lead, clearAllCache } from '@/utils/crm';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const CRMAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(900);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedAssignedUser, setSelectedAssignedUser] = useState<string>('all');

  // Combobox states
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [assignedUserOpen, setAssignedUserOpen] = useState(false);

  const employeeId = user?.employeeId || '';
  const email = user?.email || '';
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all leads
  const fetchAllLeads = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
        setConnectionStatus('syncing');
      } else {
        setIsInitialLoading(true);
      }
      
      setError(null);
      
      const apiLeads = await fetchLeads(employeeId, email, user.team);
      
      // Ensure we have an array, even if empty
      const safeLeads = Array.isArray(apiLeads) ? apiLeads : [];
      
      // Sort by creation date (newest first)
      const sortedLeads = safeLeads.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      
      setLeads(sortedLeads);
      setConnectionStatus('connected');
      setLastUpdated(new Date());
      
      console.log('Leads fetch completed:', sortedLeads.length, 'leads');
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      setError(`Failed to fetch leads: ${error.message}`);
      setConnectionStatus('disconnected');
      // Ensure leads is set to empty array on error
      setLeads([]);
    } finally {
      setIsInitialLoading(false);
      setIsAutoRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (employeeId && email) {
      fetchAllLeads(false);
    } else {
      // If no user credentials, set loading to false and show empty state
      setIsInitialLoading(false);
      setLeads([]);
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
          fetchAllLeads(true).finally(() => {
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

  // Get unique campaigns from leads
  const campaigns = React.useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const campaignSet = new Set(safeLeads.map(lead => lead.campaign || 'Uncategorized'));
    const campaignList = Array.from(campaignSet).sort();
    return ['all', ...campaignList];
  }, [leads]);

  // Get unique assigned users from leads
  const assignedUsers = React.useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const userSet = new Set<string>();
    
    safeLeads.forEach(lead => {
      if (lead._assign) {
        try {
          const assignArray = JSON.parse(lead._assign);
          if (Array.isArray(assignArray)) {
            assignArray.forEach(user => {
              if (user && typeof user === 'string') {
                // Filter out the specific email if needed, or show all
                if (user !== "gokul.krishna.687@gopocket.in") {
                  userSet.add(user);
                }
              }
            });
          }
        } catch (error) {
          console.error('Error parsing _assign:', error);
        }
      }
    });
    
    const userList = Array.from(userSet).sort();
    return ['all', ...userList];
  }, [leads]);

  // Filter leads by selected campaign and assigned user
  const filteredLeads = React.useMemo(() => {
    let filtered = leads;

    // Filter by campaign
    if (selectedCampaign !== 'all') {
      filtered = filtered.filter(lead => lead.campaign === selectedCampaign);
    }

    // Filter by assigned user
    if (selectedAssignedUser !== 'all') {
      filtered = filtered.filter(lead => {
        if (!lead._assign) return false;
        
        try {
          const assignArray = JSON.parse(lead._assign);
          return Array.isArray(assignArray) && assignArray.includes(selectedAssignedUser);
        } catch (error) {
          console.error('Error parsing _assign for filtering:', error);
          return false;
        }
      });
    }

    return filtered;
  }, [leads, selectedCampaign, selectedAssignedUser]);

  // Calculate status distribution with safe defaults - UPDATED: Removed negotiation and lost
  const statusDistribution = React.useMemo(() => {
    // Ensure leads is always an array
    const safeLeads = Array.isArray(filteredLeads) ? filteredLeads : [];
    
    const statusCounts = {
      new: 0,
      Contacted: 0,
      qualified: 0,
      followup: 0,
      won: 0,
      'Not Interested': 0,
      'Call Back': 0,
      'Switch off': 0,
      'RNR': 0
    };

    safeLeads.forEach(lead => {
      if (lead && lead.status) {
        if (statusCounts.hasOwnProperty(lead.status)) {
          statusCounts[lead.status]++;
        }
      }
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      count
    }));
  }, [filteredLeads]);

  // Calculate source distribution with safe defaults
  const sourceDistribution = React.useMemo(() => {
    const safeLeads = Array.isArray(filteredLeads) ? filteredLeads : [];
    const sourceCounts: Record<string, number> = {};
    
    safeLeads.forEach(lead => {
      if (lead && lead.source) {
        const source = lead.source || 'Unknown';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      }
    });

    return Object.entries(sourceCounts).map(([source, count]) => ({
      name: source,
      value: count,
      count
    }));
  }, [filteredLeads]);

  // Calculate summary data with safe defaults - UPDATED: Removed negotiation and lost
  const summaryData = React.useMemo(() => {
    const safeLeads = Array.isArray(filteredLeads) ? filteredLeads : [];
    
    const totalLeads = safeLeads.length;
    const newLeads = safeLeads.filter(lead => lead?.status === 'new').length;
    const contactedLeads = safeLeads.filter(lead => lead?.status === 'Contacted').length;
    const followup = safeLeads.filter(lead => lead?.status === 'followup').length;
    const qualifiedLeads = safeLeads.filter(lead => lead?.status === 'qualified').length;
    const wonLeads = safeLeads.filter(lead => lead?.status === 'won').length;
    const notInterested = safeLeads.filter(lead => lead?.status === 'Not Interested').length;
    const callBack = safeLeads.filter(lead => lead?.status === 'Call Back').length;
    const switchOff = safeLeads.filter(lead => lead?.status === 'Switch off').length;
    const rnr = safeLeads.filter(lead => lead?.status === 'RNR').length;
    
    // UPDATED: Removed 'negotiation' from conversion rate calculation
    const conversionRate = Math.round((safeLeads.filter(lead => 
      lead?.status && ['qualified', 'won'].includes(lead.status)
    ).length / Math.max(totalLeads, 1)) * 100);

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      followup,
      qualifiedLeads,
      wonLeads,
      notInterested,
      callBack,
      switchOff,
      rnr,
      conversionRate
    };
  }, [filteredLeads]);

  // Performance chart data (leads by status)
  const performanceChartData = statusDistribution.map(item => ({
    name: item.name,
    leads: item.count,
    percentage: Math.round((item.count / Math.max(summaryData.totalLeads, 1)) * 100)
  }));

  // Custom bar chart label
  const renderCustomBarLabel = ({ x, y, width, value }: any) => {
    return (
      <text 
        x={x + width / 2} 
        y={y - 4} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize={11}
        fontWeight="500"
      >
        {value > 1000 ? `${(value / 1000).toFixed(0)}K` : value}
      </text>
    );
  };

  // Status colors - UPDATED: Removed negotiation and lost colors
  const statusColors = [
    "#3b82f6", // blue-500 - New
    "#8b5cf6", // purple-500 - Contacted
    "#f59e0b", // yellow-500 - Followup
    "#10b981", // green-500 - Qualified
    "#059669", // emerald-600 - Won
    "#dc2626", // red-600 - Not Interested
    "#f97316", // orange-500 - Call Back
    "#6b7280", // gray-500 - Switch off
    "#4f46e5", // indigo-600 - RNR
  ];

  const sourceColors = [
    "#3b82f6", // blue-500
    "#10b981", // green-500
    "#f59e0b", // yellow-500
    "#ef4444", // red-500
    "#8b5cf6", // purple-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
  ];

  const handleClearCacheAndRefresh = async () => {
    if (!employeeId || !email) return;
    
    clearAllCache();
    await refreshLeads(employeeId, email, user.team);
    await fetchAllLeads(false);
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

  // Helper function to get display name from email
  const getDisplayName = (email: string) => {
    if (email === 'all') return 'All Users';
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  // Get display value for campaign combobox
  const getCampaignDisplayValue = () => {
    if (selectedCampaign === 'all') return 'All Campaigns';
    return selectedCampaign;
  };

  // Get display value for assigned user combobox
  const getAssignedUserDisplayValue = () => {
    if (selectedAssignedUser === 'all') return 'All Users';
    return getDisplayName(selectedAssignedUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                CRM Analytics Dashboard
              </h1>
              <div className="flex items-center gap-4 mt-1">
                {getConnectionStatusIcon()}
                {lastUpdated && (
                  <span className="text-sm text-slate-600">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Campaign Filter - Searchable Combobox */}
          <div className="flex items-center gap-2">
            <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={campaignOpen}
                  className="w-[280px] justify-between bg-white border-slate-300 rounded-xl shadow-sm hover:bg-slate-50"
                >
                  {getCampaignDisplayValue()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 max-h-90 overflow-hidden">
                <Command className="max-h-90">
                  <CommandInput placeholder="Search campaigns..." className="h-9" />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty>No campaign found.</CommandEmpty>
                    <CommandGroup>
                      {campaigns.map((campaign) => (
                        <CommandItem
                          key={campaign}
                          value={campaign}
                          onSelect={(currentValue) => {
                            setSelectedCampaign(currentValue === selectedCampaign ? "all" : currentValue);
                            setCampaignOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCampaign === campaign ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {campaign === 'all' ? 'All Campaigns' : campaign}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Assigned User Filter - Searchable Combobox */}
          <div className="flex items-center gap-2">
            <Popover open={assignedUserOpen} onOpenChange={setAssignedUserOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assignedUserOpen}
                  className="w-[280px] justify-between bg-white border-slate-300 rounded-xl shadow-sm hover:bg-slate-50"
                >
                  {getAssignedUserDisplayValue()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 max-h-90 overflow-hidden">
                <Command className="max-h-90">
                  <CommandInput placeholder="Search users..." className="h-9" />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {assignedUsers.map((user) => (
                        <CommandItem
                          key={user}
                          value={user}
                          onSelect={(currentValue) => {
                            setSelectedAssignedUser(currentValue === selectedAssignedUser ? "all" : currentValue);
                            setAssignedUserOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAssignedUser === user ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {getDisplayName(user)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
            />
            <label htmlFor="autoRefresh" className="text-sm font-medium text-slate-700">Auto Refresh</label>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value={60}>1 min</option>
            <option value={300}>5 min</option>
            <option value={600}>10 min</option>
            <option value={900}>15 min</option>
          </select>
          <button 
            onClick={handleClearCacheAndRefresh}
            disabled={isInitialLoading || isAutoRefreshing}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            <RefreshCw size={18} className={isInitialLoading || isAutoRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="p-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md">
            <Download size={18} />
          </button>
          <button className="p-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          {error}
        </div>
      )}

      {/* Rest of the component remains exactly the same */}
      {/* Charts Row - Only show when data is loaded and has leads */}
      {!isInitialLoading && Array.isArray(leads) && leads.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* First Column: Lead Status Distribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Lead Status Distribution
                  {(selectedCampaign !== 'all' || selectedAssignedUser !== 'all') && (
                    <span className="text-sm font-normal text-blue-600 ml-2">
                      ({selectedCampaign !== 'all' ? selectedCampaign : 'All Campaigns'}{selectedAssignedUser !== 'all' ? ` • ${getDisplayName(selectedAssignedUser)}` : ''})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Breakdown of leads by current status</p>
              </div>
             {/* <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <span className="text-sm font-semibold text-blue-700">
                  {statusDistribution.length} Statuses
                </span>
              </div> */}
            </div>

            <div className="relative">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={statusColors[index % statusColors.length]}
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="hover:opacity-80 cursor-pointer transition-opacity duration-200"
                      />
                    ))}
                  </Pie>

                  <text 
                    x="50%" 
                    y="45%" 
                    textAnchor="middle" 
                    className="text-2xl font-bold fill-gray-900"
                  >
                    {summaryData.totalLeads}
                  </text>
                  <text 
                    x="50%" 
                    y="55%" 
                    textAnchor="middle" 
                    className="text-sm fill-gray-500"
                  >
                    Total Leads
                  </text>

                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #ffffffff',
                      borderRadius: '0.75rem',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      padding: '0.3rem'
                    }}
                    itemStyle={{
                      color: '#1f2937',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                    labelStyle={{
                      color: '#111827',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                    formatter={(value, name, props) => {
                      const percentage = ((Number(value) / summaryData.totalLeads) * 100).toFixed(1);
                      return [
                        <div key="value" className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: props.color }}
                          />
                          <span className="font-semibold text-gray-900">
                            {name} : {value} leads
                          </span>
                        </div>,
                        <div key="percentage" className="text-blue-600 font-semibold">
                          {percentage}%
                        </div>
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-3 justify-center mt-6 pt-6 border-t border-gray-100">
              {statusDistribution.map((entry, index) => {
                const percentage = ((entry.value / summaryData.totalLeads) * 100).toFixed(1);
                
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: statusColors[index % statusColors.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                    <span className="text-sm text-gray-500 font-medium">({percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
              
          {/* Second Column: Stacked Charts - Lead Performance and Lead Source Distribution */}
          <div className="flex flex-col gap-6">
            {/* Lead Performance Bar Chart */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    Lead Performance
                    {(selectedCampaign !== 'all' || selectedAssignedUser !== 'all') && (
                      <span className="text-sm font-normal text-blue-600">
                        ({selectedCampaign !== 'all' ? selectedCampaign : 'All Campaigns'}{selectedAssignedUser !== 'all' ? ` • ${getDisplayName(selectedAssignedUser)}` : ''})
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">Leads distribution across status categories</p>
                </div>
                <div className="flex gap-2">
                  {/*<div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      <BarChart3 size={14} />
                      Metrics
                    </span>
                  </div>*/}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={performanceChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#f3f4f6" 
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()}
                  />
                  
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      padding: '0.75rem'
                    }}
                    formatter={(value, name) => {
                      const formattedValue = value.toLocaleString();
                      
                      return [
                        <div key={name} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: '#3b82f6' }}
                          />
                          <span className="font-semibold text-gray-900">{formattedValue} leads</span>
                        </div>,
                        'Count'
                      ];
                    }}
                  />
                  
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconSize={10}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs font-medium text-gray-700 capitalize">{value}</span>
                    )}
                    wrapperStyle={{
                      paddingBottom: '1rem'
                    }}
                  />
                  
                  <Bar 
                    dataKey="leads" 
                    name="leads"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    label={renderCustomBarLabel}
                  />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-4 justify-center mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Leads Count</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-gray-700">Conversion Rate: {summaryData.conversionRate}%</span>
                </div>
              </div>
            </div>

            {/* Lead Source Distribution */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Lead Source Distribution
                    {(selectedCampaign !== 'all' || selectedAssignedUser !== 'all') && (
                      <span className="text-sm font-normal text-blue-600 ml-2">
                        ({selectedCampaign !== 'all' ? selectedCampaign : 'All Campaigns'}{selectedAssignedUser !== 'all' ? ` • ${getDisplayName(selectedAssignedUser)}` : ''})
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">Breakdown of leads by acquisition source</p>
                </div>
                {/*<div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  <span className="text-sm font-semibold text-blue-700">
                    {sourceDistribution.length} Sources
                  </span> 
                </div>*/}
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sourceDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#f3f4f6" 
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      padding: '0.75rem'
                    }}
                    formatter={(value, name, props) => {
                      const percentage = ((Number(value) / summaryData.totalLeads) * 100).toFixed(1);
                      return [
                        <div key="value" className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sourceColors[props.payload.index % sourceColors.length] }}
                          />
                          <span className="font-semibold text-gray-900">
                            {value} leads
                          </span>
                        </div>,
                        <div key="percentage" className="text-blue-600 font-semibold">
                          {percentage}%
                        </div>
                      ];
                    }}
                  />
                  
                  <Bar 
                    dataKey="count" 
                    name="leads"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={sourceColors[index % sourceColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Third Column: Calendar */}
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Calendar</h3>
                <p className="text-sm text-gray-500">Schedule and track activities</p>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <span className="text-sm font-semibold text-blue-700">
                  Today
                </span>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Activities</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">Team Meeting</span>
                  <span className="text-xs text-gray-500 ml-auto">10:00 AM</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Client Call</span>
                  <span className="text-xs text-gray-500 ml-auto">2:30 PM</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-orange-50">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-700">Follow-up</span>
                  <span className="text-xs text-gray-500 ml-auto">4:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isInitialLoading && (
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-12 border border-gray-100 text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading CRM analytics data...</p>
        </div>
      )}

      {/* Empty State */}
      {!isInitialLoading && (!Array.isArray(leads) || leads.length === 0) && (
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-12 border border-gray-100 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Data</h3>
          <p className="text-gray-600">Start adding leads to see analytics and insights</p>
        </div>
      )}

      {/* Campaign/User-specific empty state */}
      {!isInitialLoading && Array.isArray(leads) && leads.length > 0 && filteredLeads.length === 0 && (
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-12 border border-gray-100 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Match Filters</h3>
          <p className="text-gray-600 mb-4">
            No leads found for:
            {selectedCampaign !== 'all' && <strong> Campaign: {selectedCampaign}</strong>}
            {selectedCampaign !== 'all' && selectedAssignedUser !== 'all' && ' and '}
            {selectedAssignedUser !== 'all' && <strong> Assigned To: {getDisplayName(selectedAssignedUser)}</strong>}
          </p>
          <div className="flex gap-2 justify-center">
            {selectedCampaign !== 'all' && (
              <button 
                onClick={() => setSelectedCampaign('all')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Campaigns
              </button>
            )}
            {selectedAssignedUser !== 'all' && (
              <button 
                onClick={() => setSelectedAssignedUser('all')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Users
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMAnalyticsDashboard;