// AppSidebar.tsx
import React, { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Sunrise,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  CheckSquare,
  Settings,
  Shield,
  IndianRupee,
  LogOut,
  User,
  ChevronLeft,
  Wifi,
  Building2,
  Sparkles,
  User2,
  Ticket,
  AlarmClockCheck,
  ShieldCheck,
  Megaphone,
  MegaphoneIcon,
  Drum,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Define all possible menu items - removed subitems
const allMenuItems = [
    {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Leads',
    url: '/crm',
    icon: Building2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Client',
    url: '/client',
    icon: User2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Incentive',
    url: '/incentive',
    icon: IndianRupee,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Tickets',
    url: '/tickets',
    icon: Ticket,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: FileSpreadsheet,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Contest',
    url: '/contest',
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Task',
    url: '/task',
    icon: AlarmClockCheck,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Hrms',
    url: '/hrms',
    icon: ShieldCheck,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
    roles: ['manager', 'employee']
  },
  {
    title: 'Announcement',
    url: '/announcement',
    icon: Drum,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    roles: ['manager', 'employee', 'banking']
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    roles: ['manager']
  },
];


export function AppSidebar() {
  const { state, toggleSidebar, setOpen } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, logout } = useAuth();

  // Set collapsed state as default on mount
  React.useEffect(() => {
    setOpen(false);
  }, []);

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === 'collapsed' || state === undefined;

  // Filter menu items based on user role
  const menuItems = useMemo(() => {
    if (!user) return [];
    
    return allMenuItems.filter(item => {
      return item.roles.includes(user.role);
    });
  }, [user]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="relative">
      <Sidebar 
        className={`transition-all duration-300 ease-in-out border-r border-slate-200/60 bg-gradient-to-b from-white to-slate-50/80 shadow-xl backdrop-blur-sm`} 
        collapsible="icon"
        style={{ width: isCollapsed ? '70px' : '256px' }}
      >
        <SidebarContent className="bg-transparent">
          {/* Enhanced Logo Section */}
          <div className={`transition-all duration-300 ${
            isCollapsed ? 'p-3' : 'p-5'
          } border-b border-slate-200/60 bg-gradient-to-r from-blue-600/5 to-indigo-600/5`}>
            <div className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'space-x-3'
            }`}>
              <div className="relative">
                <div className={`bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl shadow-lg transition-all duration-300 ${
                  isCollapsed ? 'p-2' : 'p-3'
                } relative overflow-hidden`}>
                  <Shield className={`text-white transition-all duration-300 ${
                    isCollapsed ? 'h-5 w-5' : 'h-7 w-7'
                  } relative z-10`} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  {!isCollapsed && <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300" />}
                </div>
                {!isCollapsed && <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>}
              </div>
              {!isCollapsed && (
                <div className="transition-all duration-300">
                  <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                      GoPocket
                    </h2>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                  </div>
                  {user && (
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                     <span className="text-slate-700">{user.email.split('@')[0]}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Navigation Menu - Centered icons in collapsed view */}
          <SidebarGroup className={`transition-all duration-300 ${
            isCollapsed ? 'px-0 py-4 mt-4' : 'px-3 py-5 mt-6'
          }`}>
            <SidebarGroupContent className="mt-2">
              <SidebarMenu className={`space-y-2 ${isCollapsed ? 'flex flex-col items-center w-full' : ''}`}>
                {menuItems.map((item) => {
                  const isItemActive = isActive(item.url);
                  
                  return (
                    <SidebarMenuItem key={item.title} className={isCollapsed ? 'w-full flex justify-center' : ''}>
                      <SidebarMenuButton 
                        asChild
                        tooltip={isCollapsed ? item.title : undefined}
                        className={isCollapsed ? 'w-auto' : ''}
                      >
                        <NavLink 
                          to={item.url} 
                          className={`group relative transition-all duration-200 ${
                            isItemActive 
                              ? "text-blue-700 font-semibold" 
                              : ""
                          } ${isCollapsed ? '' : ''} ${
                            isItemActive 
                              ? '' 
                              : ''
                          }  ${isCollapsed ? 'w-14 h-14 flex items-center justify-center' : ''}`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className={`flex items-center transition-all duration-200 ${
                            isCollapsed ? 'justify-center' : 'space-x-3 py-3 px-3'
                          } rounded-xl relative z-10`}>
                            <div className={` ${
                              isCollapsed ? 'p-2' : 'p-2.5'
                            } ${
                              isItemActive 
                                ? 'bg-blue-500/20' 
                                : item.bgColor
                            }`}>
                              <item.icon 
                                className={`flex-shrink-0 transition-all duration-200 ${
                                  isCollapsed ? 'h-5 w-5' : 'h-5 w-5'
                                } ${isItemActive ? 'text-blue-600' : item.color}`} 
                              />
                            </div>
                            {!isCollapsed && (
                              <div className="flex-1 min-w-0 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold truncate">{item.title}</span>
                                  {isItemActive && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Enhanced User Profile & Logout Section - Centered in collapsed view */}
          <div className={`mt-auto transition-all duration-300 ${
            isCollapsed ? 'p-2' : 'p-4'
          } border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-slate-100/30`}>
            {user && (
              <div className={`transition-all duration-300`}>
                {!isCollapsed ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.employeeId}</p>
                        <p className="text-xs text-slate-500 font-medium">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-200"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-600 transition-colors duration-200" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-9 h-9 flex items-center justify-center hover:bg-red-50 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-200"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-600 transition-colors duration-200" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Enhanced Modern Collapse Toggle Button - Fixed Position */}
      <button
        onClick={toggleSidebar}
        className={`
          fixed top-20 z-50 
          flex items-center justify-center
          w-7 h-7
          bg-gradient-to-br from-blue-500 to-indigo-600
          hover:from-blue-600 hover:to-indigo-700
          rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          hover:scale-110
          group
          border-2 border-white
        `}
        style={{ left: isCollapsed ? '56px' : '242px' }}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft 
          className={`
            h-3 w-3 
            text-white
            transition-all duration-300 ease-in-out
            ${isCollapsed ? 'rotate-180' : 'rotate-0'}
          `}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </div>
  );
}