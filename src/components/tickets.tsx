// pages/tickets.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Activity, MessageCircle, AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight, Download, Filter, Search, Building2, Briefcase, ChevronDown, User, RefreshCw } from 'lucide-react';
import DateRangePicker from '@/components/ManagementReport/DateRangePicker';
import TicketsTab from '@/components/Tickets/TicketsTab';
import { DateRange, Tab } from '@/utils/types';

interface TicketData {
  id: string;
  title: string;
  status: 'open' | 'closed' | 'in-progress' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  responseTime: number;
  satisfaction: number;
}

const Tickets: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: '',
    end: ''
  });
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Dummy tickets data
  const [ticketsData, setTicketsData] = useState<TicketData[]>([]);

  // Initialize default date range
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setDateRange({
      start: formatDateForInput(firstDayOfMonth),
      end: formatDateForInput(today)
    });
  }, []);

  // Generate dummy data
  useEffect(() => {
    const generateDummyData = () => {
      const categories = ['Technical', 'Billing', 'Account', 'Trading', 'General Support', 'Platform Issue'];
      const assignees = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Emily Davis'];
      const statuses: ('open' | 'closed' | 'in-progress' | 'pending')[] = ['open', 'closed', 'in-progress', 'pending'];
      const priorities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
      
      const dummyData: TicketData[] = [];
      
      for (let i = 1; i <= 50; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        
        dummyData.push({
          id: `TKT${String(i).padStart(4, '0')}`,
          title: `Support Request ${i} - ${categories[Math.floor(Math.random() * categories.length)]} Issue`,
          status,
          priority,
          category: categories[Math.floor(Math.random() * categories.length)],
          assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          responseTime: Math.random() * 24 + 1, // 1-25 hours
          satisfaction: Math.floor(Math.random() * 5) + 1 // 1-5
        });
      }
      
      setTicketsData(dummyData);
      setIsInitialLoading(false);
    };

    generateDummyData();
  }, []);

  const tabs: Tab[] = [
    { id: 'overview', label: 'Tickets Overview', icon: Activity },
    { id: 'summary', label: 'Tickets Summary', icon: MessageCircle },
    { id: 'my-tickets', label: 'My Tickets', icon: User },
    { id: 'team-tickets', label: 'Team Tickets', icon: Users }
  ];

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading tickets data...</p>
      </div>
    </div>
  );

  const renderSummaryTab = () => {
    const openTickets = ticketsData.filter(ticket => ticket.status === 'open').length;
    const closedTickets = ticketsData.filter(ticket => ticket.status === 'closed').length;
    const inProgressTickets = ticketsData.filter(ticket => ticket.status === 'in-progress').length;
    const pendingTickets = ticketsData.filter(ticket => ticket.status === 'pending').length;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <AlertTriangle className="text-white" size={20} />
              </div>
              <span className="text-sm font-semibold text-red-700">Open Tickets</span>
            </div>
            <p className="text-3xl font-bold text-red-900">{openTickets}</p>
            <p className="text-xs text-red-600 mt-2">Requires immediate attention</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <CheckCircle className="text-white" size={20} />
              </div>
              <span className="text-sm font-semibold text-green-700">Closed Tickets</span>
            </div>
            <p className="text-3xl font-bold text-green-900">{closedTickets}</p>
            <p className="text-xs text-green-600 mt-2">Successfully resolved</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Clock className="text-white" size={20} />
              </div>
              <span className="text-sm font-semibold text-blue-700">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{inProgressTickets}</p>
            <p className="text-xs text-blue-600 mt-2">Currently being worked on</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-500 p-2 rounded-lg">
                <Users className="text-white" size={20} />
              </div>
              <span className="text-sm font-semibold text-yellow-700">Pending</span>
            </div>
            <p className="text-3xl font-bold text-yellow-900">{pendingTickets}</p>
            <p className="text-xs text-yellow-600 mt-2">Awaiting customer response</p>
          </div>
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Response Time Analysis</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Response Time</span>
                <span className="text-lg font-bold text-blue-600">4.2 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SLA Compliance</span>
                <span className="text-lg font-bold text-green-600">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">First Contact Resolution</span>
                <span className="text-lg font-bold text-purple-600">78%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tickets per Agent</span>
                <span className="text-lg font-bold text-orange-600">12.5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="text-lg font-bold text-green-600">4.3/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolution Rate</span>
                <span className="text-lg font-bold text-blue-600">85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
              <MessageCircle size={18} />
              New Ticket
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
              <Download size={18} />
              Export Report
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
              <Filter size={18} />
              Filter Tickets
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
              <Users size={18} />
              Assign Tickets
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMyTicketsTab = () => {
    const myTickets = ticketsData.filter(ticket => ticket.assignedTo === 'John Doe');
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">My Assigned Tickets</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticket ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">#{ticket.id}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{ticket.title}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                        ticket.status === 'closed' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamTicketsTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Ticket Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Emily Davis'].map((agent, index) => {
              const agentTickets = ticketsData.filter(ticket => ticket.assignedTo === agent);
              const openTickets = agentTickets.filter(ticket => ticket.status === 'open').length;
              
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{agent}</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {agentTickets.length} tickets
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Open:</span>
                      <span className="font-medium text-red-600">{openTickets}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Closed:</span>
                      <span className="font-medium text-green-600">
                        {agentTickets.filter(t => t.status === 'closed').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Satisfaction:</span>
                      <span className="font-medium text-purple-600">
                        {(agentTickets.reduce((sum, t) => sum + t.satisfaction, 0) / agentTickets.length || 0).toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Loading Overlay */}
      {isInitialLoading && <LoadingOverlay />}

      <div className="w-full p-6">
        {/* Date Range Picker */}
        <DateRangePicker 
          dateRange={dateRange}
          setDateRange={setDateRange}
          loading={loading}
        />

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-50 mb-6 border border-gray-100 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'overview' && (
            <TicketsTab 
              ticketsData={ticketsData}
              isInitialLoading={isInitialLoading}
            />
          )}
          {activeTab === 'summary' && renderSummaryTab()}
          {activeTab === 'my-tickets' && renderMyTicketsTab()}
          {activeTab === 'team-tickets' && renderTeamTicketsTab()}
        </div>
      </div>
    </div>
  );
};

export default Tickets;