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
  CalendarCheck,
  Clock,
  ChevronsUpDown,
  ArrowUpDown
} from 'lucide-react';

// Import the actual useAuth hook and fetchLeads function
import { useAuth } from '@/contexts/AuthContext';
import { fetchLeads, refreshLeads, type Lead, clearAllCache } from '@/utils/crm';
import { PathBreadcrumb } from './PathBreadcrumb';
import { SummaryCard, SummaryCardsGrid } from './SummaryCard';
import { AddLeadDialog } from './AddLeadDialog';

// Import shadcn table components
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import combobox components
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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

// Rate limiting constants
const REFRESH_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes in milliseconds

// Custom filter functions for TanStack Table
const globalFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
  const search = filterValue.toLowerCase();
  const lead = row.original;
  
  return (
    lead.name?.toLowerCase().includes(search) ||
    lead.company?.toLowerCase().includes(search) ||
    lead.email?.toLowerCase().includes(search) ||
    lead.phone?.toLowerCase().includes(search) ||
    lead.city?.toLowerCase().includes(search) ||
    lead.source?.toLowerCase().includes(search) ||
    lead.campaign?.toLowerCase().includes(search) ||
    lead.status?.toLowerCase().includes(search) ||
    false
  );
};

const statusFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
  if (filterValue === 'all' || !filterValue) return true;
  return row.original.status === filterValue;
};

const campaignFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  const campaign = row.original.campaign || '';
  return campaign.toLowerCase().includes(filterValue.toLowerCase());
};

const assignedUserFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  const assignData = row.original._assign as string;
  try {
    const assignedUsers = JSON.parse(assignData || "[]") as string[];
    return assignedUsers.some(user => 
      user.toLowerCase().includes(filterValue.toLowerCase())
    );
  } catch {
    return false;
  }
};

const CRMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(900); // 15 minutes in seconds
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');
  const [newRecordsCount, setNewRecordsCount] = useState(0);
  const [modifiedRecordsCount, setModifiedRecordsCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);

  // Filter states
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedAssignedUser, setSelectedAssignedUser] = useState<string>('');

  // Rate limiting state
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Bulk action state
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Refs
  const lastFetchedData = useRef<Lead[]>([]);
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Get actual user credentials from auth context
  const employeeId = user?.employeeId || '';
  const email = user?.email || '';
  const teamMembers = user?.team ? JSON.parse(user.team) : [];

    // Helper function to get display name from email
  const getDisplayName = (email: string) => {
    if (email === 'all') return 'All Users';
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };


  // Get unique campaigns and assigned users
  const campaignOptions = useMemo(() => {
    const campaigns = Array.from(new Set(
      leads
        .map(lead => lead.campaign)
        .filter(Boolean)
        .sort()
    )).map(campaign => ({
      value: campaign,
      label: campaign
    }));
    
    return [{ value: 'all', label: 'All Campaigns' }, ...campaigns];
  }, [leads]);

  const assignedUserOptions = useMemo(() => {
    const users = new Set<string>();
    leads.forEach(lead => {
      try {
        const assignData = JSON.parse(lead._assign || "[]") as string[];
        assignData.forEach(user => {
          if (user !== "gokul.krishna.687@gopocket.in") {
            users.add(user);
          }
        });
      } catch (e) {
        // ignore parsing errors
      }
    });
    
    const userOptions = Array.from(users).sort().map(user => ({
      value: user,
      label: getDisplayName(user)
    }));
    
    return [{ value: 'all', label: 'All Users' }, ...userOptions];
  }, [leads]);

  // Get status color
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
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Column definitions for TanStack Table
  const columns: ColumnDef<Lead>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Lead Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const lead = row.original;
        return (
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
        )
      },
    },
    {
      accessorKey: "source",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("source")}</div>,
    },
    {
      accessorKey: "campaign",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Campaign
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("campaign") || 'N/A'}</div>,
      filterFn: campaignFilterFn,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Contact
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <PhoneIcon size={14} className="text-gray-400" />
          <span>{row.getValue("phone")}</span>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            City
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            <span>{row.getValue("city") || 'N/A'}</span>
          </div>
          {row.original.branchCode && (
            <div className="text-xs text-gray-400">
              Branch: {row.original.branchCode}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as Lead['status'];
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
      filterFn: statusFilterFn,
    },
    {
      accessorKey: "lastActivity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Modified
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("lastActivity")}</div>,
    },
    {
      accessorKey: "_assign",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assigned To
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const assignData = row.getValue("_assign") as string;
        return (
          <div className="flex -space-x-2">
            {JSON.parse(assignData || "[]")
              .filter((user: string) => user !== "gokul.krishna.687@gopocket.in")
              .map((user: string, index: number) => {
                const firstLetter = user.charAt(0).toUpperCase();
                return (
                  <div key={index} className="relative group">
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white text-sm font-semibold border-2 border-white cursor-pointer"
                      title={user}
                    >
                      {firstLetter}
                    </div>
                  </div>
                );
              })}
          </div>
        )
      },
      filterFn: assignedUserFilterFn,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div>
            <p className="text-sm text-gray-900">{date.toLocaleDateString('en-GB')}</p>
            {row.original.firstRespondedOn && (
              <p className="text-xs text-gray-400">
                First response: {new Date(row.original.firstRespondedOn).toLocaleDateString()}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === lead.id ? null : lead.id);
                }}
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
        )
      },
      enableHiding: false,
    },
  ];

  // Filter leads to only include relevant statuses
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => 
      ['new', 'Contacted', 'qualified', 'followup', 'Not Interested', 'Call Back', 'Switch off', 'RNR'].includes(lead.status)
    );
  }, [leads]);

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredLeads,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
  });

  // Apply campaign and assigned user filters
  useEffect(() => {
    if (selectedCampaign && selectedCampaign !== 'all') {
      table.getColumn('campaign')?.setFilterValue(selectedCampaign);
    } else {
      table.getColumn('campaign')?.setFilterValue('');
    }
  }, [selectedCampaign, table]);

  useEffect(() => {
    if (selectedAssignedUser && selectedAssignedUser !== 'all') {
      table.getColumn('_assign')?.setFilterValue(selectedAssignedUser);
    } else {
      table.getColumn('_assign')?.setFilterValue('');
    }
  }, [selectedAssignedUser, table]);

  // Rate limiting functions
  const canRefresh = useMemo(() => {
    if (!lastRefreshTime) return true;
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    const canRefreshNow = timeSinceLastRefresh >= REFRESH_COOLDOWN_MS;
    
    if (canRefreshNow && cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
      setCooldownRemaining(0);
    }
    
    return canRefreshNow;
  }, [lastRefreshTime, cooldownRemaining]);

  const getCooldownRemaining = () => {
    if (!lastRefreshTime) return 0;
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    return Math.max(0, REFRESH_COOLDOWN_MS - timeSinceLastRefresh);
  };

  const formatCooldownTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update the cooldown timer effect
  useEffect(() => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
    
    if (lastRefreshTime && !canRefresh) {
      const initialRemaining = getCooldownRemaining();
      setCooldownRemaining(initialRemaining);
      
      cooldownIntervalRef.current = setInterval(() => {
        const remaining = getCooldownRemaining();
        setCooldownRemaining(remaining);
        
        if (remaining <= 0) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          setCooldownRemaining(0);
        }
      }, 1000);
    } else {
      setCooldownRemaining(0);
    }

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, [lastRefreshTime, canRefresh]);

  // Function to change lead status
  const changeLeadStatus = async (leadId: string, newStatus: string, leadName: string) => {
    setIsChangingStatus(leadId);
    setOpenDropdown(null);
    
    try {
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

      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, status: newStatus as Lead['status'] }
            : lead
        )
      );

      console.log(`Status changed to ${newStatus} for lead: ${leadName}`);
      
    } catch (error: any) {
      console.error('Error changing lead status:', error);
      setError(`Failed to change status: ${error.message}`);
    } finally {
      setIsChangingStatus(null);
      handleClearCacheAndRefresh();
    }
  };

  // Bulk action functions
  const handleBulkAssign = async () => {
    const selectedLeads = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
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

      setSelectedTeamMember('');
      table.toggleAllPageRowsSelected(false);

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
    const selectedLeads = table.getFilteredSelectedRowModel().rows;
    if (selectedLeads.length === 0) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <span className="text-blue-800 font-medium text-sm sm:text-base">
              {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
            </span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full sm:w-[280px] justify-between bg-white border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 text-sm"
                >
                  {selectedTeamMember ? getDisplayName(selectedTeamMember) : "Select team member"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full sm:w-[280px] p-0 max-h-90 overflow-hidden">
                <Command className="max-h-90">
                  <CommandInput placeholder="Search users..." className="h-9" />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {teamMembers.map((user: string) => (
                        <CommandItem
                          key={user}
                          value={user}
                          onSelect={(currentValue) => {
                            setSelectedTeamMember(currentValue === selectedTeamMember ? "" : currentValue);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTeamMember === user ? "opacity-100" : "opacity-0"
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

            <button
              onClick={handleBulkAssign}
              disabled={!selectedTeamMember || isAssigning}
              className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center text-sm"
            >
              {isAssigning ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Users size={14} />
              )}
              Assign Selected
            </button>
          </div>

          <button
            onClick={() => table.toggleAllPageRowsSelected(false)}
            className="text-gray-500 hover:text-gray-700 text-sm w-full sm:w-auto text-center"
          >
            Clear selection
          </button>
        </div>
      </div>
    );
  };

  // Campaign Filter Combobox
  const CampaignFilter = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full sm:w-[200px] justify-between"
          >
            {selectedCampaign
              ? campaignOptions.find((campaign) => campaign.value === selectedCampaign)?.label
              : "Select campaign..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search campaign..." />
            <CommandList>
              <CommandEmpty>No campaign found.</CommandEmpty>
              <CommandGroup>
                {campaignOptions.map((campaign) => (
                  <CommandItem
                    key={campaign.value}
                    value={campaign.value}
                    onSelect={(currentValue) => {
                      setSelectedCampaign(currentValue === selectedCampaign ? "" : currentValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCampaign === campaign.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {campaign.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Assigned User Filter Combobox
  const AssignedUserFilter = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full sm:w-[200px] justify-between"
          >
            {selectedAssignedUser
              ? assignedUserOptions.find((user) => user.value === selectedAssignedUser)?.label
              : "Select user..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search user..." />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {assignedUserOptions.map((user) => (
                  <CommandItem
                    key={user.value}
                    value={user.value}
                    onSelect={(currentValue) => {
                      setSelectedAssignedUser(currentValue === selectedAssignedUser ? "" : currentValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAssignedUser === user.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {user.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Fetch all leads function
  const fetchAllLeads = async (isAutoRefresh = false, isManualRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
        setConnectionStatus('syncing');
      } else if (isManualRefresh) {
        setIsManualRefreshing(true);
        setConnectionStatus('syncing');
      } else {
        setIsInitialLoading(true);
      }
      
      setError(null);
      
      const apiLeads = await fetchLeads(employeeId, email, user.team);
      
      if (isAutoRefresh && lastFetchedData.current.length > 0) {
        // Incremental update logic
        const currentDataMap = new Map(lastFetchedData.current.map(lead => [lead.id, getLeadContentHash(lead)]));
        const newDataMap = new Map(apiLeads.map(lead => [lead.id, getLeadContentHash(lead)]));
        
        let newCount = 0;
        let modifiedCount = 0;
        
        const cleanCurrentData = lastFetchedData.current.map(lead => ({
          ...lead,
          _isNew: false,
          _isModified: false
        }));
        
        const currentDataById = new Map(cleanCurrentData.map(lead => [lead.id, lead]));
        
        const updatedLeads: Lead[] = [];
        
        apiLeads.forEach(newLead => {
          const leadId = newLead.id;
          const newContentHash = newDataMap.get(leadId);
          const oldContentHash = currentDataMap.get(leadId);
          const existingLead = currentDataById.get(leadId);
          
          if (!existingLead) {
            newLead._isNew = true;
            updatedLeads.push(newLead);
            newCount++;
          } else if (oldContentHash !== newContentHash) {
            newLead._isModified = true;
            updatedLeads.push(newLead);
            modifiedCount++;
          } else {
            updatedLeads.push(existingLead);
          }
        });
        
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
      }
      
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('JSON')) {
        setError('Unable to load leads. Please check your connection and try again.');
      } else {
        setError(`Failed to fetch leads: ${error.message}`);
      }
      setConnectionStatus('disconnected');
    } finally {
      setIsInitialLoading(false);
      setIsAutoRefreshing(false);
      setIsManualRefreshing(false);
    }
  };

  // Helper function to get lead content hash for comparison
  const getLeadContentHash = (lead: Lead): string => {
    const keys: (keyof Lead)[] = ['name', 'email', 'phone', 'company', 'status', 'value', 'assignedTo', 'lastActivity'];
    return keys.map(key => String(lead[key] || '')).join('|');
  };

  // Rate-limited refresh function
  const handleRateLimitedRefresh = async () => {
    if (!canRefresh) {
      setError(`Please wait ${formatCooldownTime(cooldownRemaining)} before refreshing again`);
      return;
    }

    setLastRefreshTime(Date.now());
    await handleClearCacheAndRefresh();
  };

  // Modified clear cache and refresh function
  const handleClearCacheAndRefresh = async () => {
    if (!employeeId || !email) return;
    
    clearAllCache();
    await refreshLeads(employeeId, email, user.team);
    await fetchAllLeads(false, true);
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

  // Calculate summary data
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

  const handleLeadClick = (leadId: string) => {
    if (table.getFilteredSelectedRowModel().rows.length === 0) {
      navigate(`/crm/leads/${leadId}`);
    }
  };

  const handleLeadAdded = () => {
    handleClearCacheAndRefresh();
  };

  const toggleDropdown = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === leadId ? null : leadId);
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

  // Refresh button component with rate limiting
  const RefreshButton = () => {
    const isRefreshing = isManualRefreshing || isAutoRefreshing;
    const isDisabled = !canRefresh || isRefreshing || isInitialLoading;

    let buttonContent;
    if (isRefreshing) {
      buttonContent = (
        <>
          <RefreshCw size={16} className="animate-spin" />
          Refreshing...
        </>
      );
    } else if (!canRefresh && cooldownRemaining > 0) {
      buttonContent = (
        <>
          <Clock size={16} />
          {formatCooldownTime(cooldownRemaining)}
        </>
      );
    } else {
      buttonContent = (
        <>
          <RefreshCw size={16} />
          Refresh
        </>
      );
    }

    return (
      <button 
        onClick={handleRateLimitedRefresh}
        disabled={isDisabled}
        className="px-4 py-2 text-gray-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed relative group shadow-sm hover:shadow-md"
        title={!canRefresh ? `Available in ${formatCooldownTime(cooldownRemaining)}` : 'Refresh leads'}
      >
        {buttonContent}
        
        {!canRefresh && cooldownRemaining > 0 && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg z-10">
            Available in {formatCooldownTime(cooldownRemaining)}
          </div>
        )}
      </button>
    );
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

  // New Mobile Lead Row Component using TanStack Table
  const MobileLeadRow = ({ row }: { row: any }) => {
    const lead = row.original;
    
    return (
      <div 
        className={`bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer ${
          lead._isNew ? 'bg-green-50 border-l-4 border-green-400' : 
          lead._isModified ? 'bg-blue-50 border-l-4 border-blue-400' : ''
        }`}
        onClick={() => handleLeadClick(lead.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
            />
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {lead.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{lead.name}</p>
              {lead.ucc && (
                <p className="text-xs text-gray-400 truncate">UCC: {lead.ucc}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </span>
            <button 
              className="p-1 text-gray-400 hover:text-gray-600"
              onClick={(e) => toggleDropdown(lead.id, e)}
              disabled={isChangingStatus === lead.id}
            >
              {isChangingStatus === lead.id ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <MoreVertical size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="flex items-center gap-2">
            <PhoneIcon size={14} className="text-gray-400" />
            <span className="text-gray-700 truncate">{lead.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-gray-400" />
            <span className="text-gray-700 truncate">{lead.city || 'N/A'}</span>
          </div>
        </div>

        {/* Source and Campaign */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Source: {lead.source}</span>
          <span>Campaign: {lead.campaign || 'N/A'}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
          <span>Created: {new Date(lead.createdAt).toLocaleDateString('en-GB')}</span>
          <span>Modified: {lead.lastActivity}</span>
        </div>

        {/* Assignees */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex -space-x-2">
            {JSON.parse(lead._assign || "[]")
              .filter((user: string) => user !== "gokul.krishna.687@gopocket.in")
              .map((user: string, index: number) => {
                const firstLetter = user.charAt(0).toUpperCase();
                return (
                  <div key={index} className="relative group">
                    <div
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold border-2 border-white"
                      title={user}
                    >
                      {firstLetter}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced loading state
  const LoadingState = () => (
    <div className="text-center py-12">
      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-600">Loading leads...</p>
    </div>
  );

  // Enhanced empty state
  const EmptyState = () => (
    <div className="text-center py-12">
      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No leads assigned to you</h3>
      <p className="text-gray-600 mb-6">You don't have any leads assigned to you at the moment.</p>
      <AddLeadDialog onLeadAdded={handleLeadAdded} />
    </div>
  );

  // Enhanced no results state
  const NoResultsState = () => (
    <div className="text-center py-12">
      <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No matching leads found</h3>
      <p className="text-gray-600">Try adjusting your search or filters to find what you're looking for.</p>
    </div>
  );

  // Mobile filters panel
  const MobileFiltersPanel = () => (
    <div className="lg:hidden bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search all leads..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CampaignFilter />
          <AssignedUserFilter />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Filter size={16} className="mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status.value}
                  checked={table.getColumn('status')?.getFilterValue() === status.value}
                  onCheckedChange={() => {
                    table.getColumn('status')?.setFilterValue(
                      table.getColumn('status')?.getFilterValue() === status.value ? '' : status.value
                    );
                  }}
                >
                  {status.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full p-4 sm:p-6">
  
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Path Breadcrumb */}
               <PathBreadcrumb />
              {getConnectionStatusIcon()}
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-4 text-xs sm:text-sm">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Auto Refresh Toggle */}
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
            {/* Refresh Interval Select */}
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
            
            {/* Use the new RefreshButton component */}
            <RefreshButton />
            
            <AddLeadDialog onLeadAdded={handleLeadAdded} />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
           <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Lead Management</h1>
        </div>

        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <SummaryCard
            title="Total Leads" value={summaryData.totalLeads} icon={Users} color="blue" shadowColor="blue" trend={{ value: 12.5, isPositive: true }} showTrend={true} className="h-full" />
          
          <SummaryCard
            title="New Leads" value={summaryData.newLeads} icon={User} color="green" shadowColor="green" trend={{ value: 8.2, isPositive: true }} showTrend={true} className="h-full" />
          
          <SummaryCard
            title="Contacted Leads" value={summaryData.contactedLeads} icon={BookText} color="orange" shadowColor="orange" trend={{ value: 22.1, isPositive: true }} 
            showTrend={true} className="h-full" />

          <SummaryCard
            title="Followup" value={summaryData.followup} icon={CalendarCheck} color="yellow" shadowColor="yellow" trend={{ value: 22.1, isPositive: true }} 
            showTrend={true} className="h-full" />
          
          <SummaryCard
            title="Qualified Leads" value={summaryData.qualifiedLeads} icon={CheckSquare} color="purple" shadowColor="purple" trend={{ value: 15.3, isPositive: true }} showTrend={true} className="h-full" />
        </div>
        
        {/* Bulk Actions Bar */}
        <BulkActionsBar />
        
        {/* Mobile Filters */}
        <MobileFiltersPanel />
        
        {/* Desktop Filters */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search all leads..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3"
                />
              </div>

              {/* Campaign Filter */}
              <CampaignFilter />

              {/* Assigned User Filter */}
              <AssignedUserFilter />

              {/* Status Filter using TanStack Table */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="px-4 py-3">
                    <Filter className="mr-2 h-4 w-4" />
                    Status: {table.getColumn('status')?.getFilterValue() ? 
                      statusOptions.find(s => s.value === table.getColumn('status')?.getFilterValue())?.label : 
                      'All'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={!table.getColumn('status')?.getFilterValue()}
                    onCheckedChange={() => table.getColumn('status')?.setFilterValue('')}
                  >
                    All Status
                  </DropdownMenuCheckboxItem>
                  {statusOptions.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status.value}
                      checked={table.getColumn('status')?.getFilterValue() === status.value}
                      onCheckedChange={() => {
                        table.getColumn('status')?.setFilterValue(
                          table.getColumn('status')?.getFilterValue() === status.value ? '' : status.value
                        );
                      }}
                    >
                      {status.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-2">
              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Leads Table/List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Mobile View with TanStack Table */}
          <div className="lg:hidden">
            {isInitialLoading ? (
              <LoadingState />
            ) : leads.length === 0 ? (
              <EmptyState />
            ) : table.getRowModel().rows?.length === 0 ? (
              <NoResultsState />
            ) : (
              <div className="p-4">
                {table.getRowModel().rows.map((row) => (
                  <MobileLeadRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </div>

          {/* Desktop View with TanStack Table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        row.original._isNew ? 'bg-green-50 border-l-4 border-green-400' : 
                        row.original._isModified ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                      }`}
                      onClick={() => handleLeadClick(row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {isInitialLoading ? (
                        <LoadingState />
                      ) : leads.length === 0 ? (
                        <EmptyState />
                      ) : (
                        <NoResultsState />
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isInitialLoading && leads.length > 0 && table.getRowModel().rows?.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value))
                    }}
                    className="h-8 w-[70px] rounded-md border border-gray-300 bg-transparent text-sm"
                  >
                    {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;