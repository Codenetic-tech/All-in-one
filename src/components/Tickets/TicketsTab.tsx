// components/Tickets/TicketsTab.tsx
import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, Package, MessageCircle, AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3, Filter, Download, Search } from 'lucide-react';

interface TicketData {
  id: string;
  title: string;
  status: 'open' | 'closed' | 'in-progress' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  responseTime: number; // in hours
  satisfaction: number; // 1-5
}

interface TicketsTabProps {
  ticketsData: TicketData[];
  isInitialLoading: boolean;
}

const TicketsTab: React.FC<TicketsTabProps> = ({ 
  ticketsData, 
  isInitialLoading 
}) => {
  // Calculate ticket statistics
  const totalTickets = ticketsData.length;
  const openTickets = ticketsData.filter(ticket => ticket.status === 'open').length;
  const closedTickets = ticketsData.filter(ticket => ticket.status === 'closed').length;
  const inProgressTickets = ticketsData.filter(ticket => ticket.status === 'in-progress').length;
  const pendingTickets = ticketsData.filter(ticket => ticket.status === 'pending').length;

  // Priority breakdown
  const criticalTickets = ticketsData.filter(ticket => ticket.priority === 'critical').length;
  const highPriorityTickets = ticketsData.filter(ticket => ticket.priority === 'high').length;
  const mediumPriorityTickets = ticketsData.filter(ticket => ticket.priority === 'medium').length;
  const lowPriorityTickets = ticketsData.filter(ticket => ticket.priority === 'low').length;

  // Category breakdown
  const categoryCount = ticketsData.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Response time analysis
  const avgResponseTime = ticketsData.reduce((sum, ticket) => sum + ticket.responseTime, 0) / totalTickets;
  const avgSatisfaction = ticketsData.reduce((sum, ticket) => sum + ticket.satisfaction, 0) / totalTickets;

  // Chart data for ticket trends
  const statusChartData = [
    { name: 'Open', value: openTickets, color: '#ef4444' },
    { name: 'In Progress', value: inProgressTickets, color: '#f59e0b' },
    { name: 'Pending', value: pendingTickets, color: '#8b5cf6' },
    { name: 'Closed', value: closedTickets, color: '#10b981' }
  ];

  const priorityChartData = [
    { name: 'Critical', value: criticalTickets, color: '#dc2626' },
    { name: 'High', value: highPriorityTickets, color: '#ef4444' },
    { name: 'Medium', value: mediumPriorityTickets, color: '#f59e0b' },
    { name: 'Low', value: lowPriorityTickets, color: '#10b981' }
  ];

  const categoryChartData = Object.entries(categoryCount).map(([name, value], index) => ({
    name,
    value,
    color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]
  }));

  // Monthly trend data (dummy data for now)
  const monthlyTrendData = [
    { month: 'Jan', opened: 45, closed: 38, responseTime: 12.4 },
    { month: 'Feb', opened: 52, closed: 45, responseTime: 11.8 },
    { month: 'Mar', opened: 48, closed: 42, responseTime: 10.2 },
    { month: 'Apr', opened: 61, closed: 52, responseTime: 9.8 },
    { month: 'May', opened: 55, closed: 58, responseTime: 8.5 },
    { month: 'Jun', opened: 49, closed: 51, responseTime: 7.9 }
  ];

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
        {value}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-blue-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              12.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-80 mb-1">Total Tickets</h3>
          <p className="text-2xl font-bold">{totalTickets.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-red-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-red-500 hover:to-red-600 hover:text-white hover:shadow-red-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              8.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Open Tickets</h3>
          <p className="text-2xl font-bold">{openTickets.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-green-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 hover:text-white hover:shadow-green-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              5.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Closed Tickets</h3>
          <p className="text-2xl font-bold">{closedTickets.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-yellow-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-yellow-500 hover:to-yellow-600 hover:text-white hover:shadow-yellow-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-yellow-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Clock size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
              <ArrowDownRight size={14} />
              3.2%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Avg Response Time</h3>
          <p className="text-2xl font-bold">{avgResponseTime.toFixed(1)}h</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-purple-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-500 hover:to-purple-600 hover:text-white hover:shadow-purple-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Users size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              8.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Satisfaction Rate</h3>
          <p className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}/5</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-orange-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-orange-500 hover:to-orange-600 hover:text-white hover:shadow-orange-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Activity size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              15.3%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Critical Tickets</h3>
          <p className="text-2xl font-bold">{criticalTickets.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      {!isInitialLoading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Status Distribution */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ticket Status Distribution</h3>
                  <p className="text-sm text-gray-500">Breakdown of tickets by current status</p>
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  <span className="text-sm font-semibold text-blue-700">
                    {totalTickets} Total
                  </span>
                </div>
              </div>

              <div className="relative">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
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
                      {statusChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
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
                      {totalTickets}
                    </text>
                    <text 
                      x="50%" 
                      y="55%" 
                      textAnchor="middle" 
                      className="text-sm fill-gray-500"
                    >
                      Total Tickets
                    </text>

                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '1rem'
                      }}
                      formatter={(value, name, props) => {
                        const percentage = ((Number(value) / totalTickets) * 100).toFixed(1);
                        return [
                          <div key="value" className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: props.color }}
                            />
                            <span className="font-semibold text-gray-900">
                              {value} tickets
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
                {statusChartData.map((entry, index) => {
                  const percentage = ((entry.value / totalTickets) * 100).toFixed(1);
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                      <span className="text-sm text-gray-500 font-medium">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Ticket Trends */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    Monthly Ticket Trends
                  </h3>
                  <p className="text-sm text-gray-500">Ticket volume and response time trends</p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      <BarChart3 size={14} />
                      Trends
                    </span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#f3f4f6" 
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="month" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  
                  <YAxis 
                    yAxisId="left"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    domain={[0, 24]}
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
                      const formattedValue = name === 'responseTime' 
                        ? `${Number(value).toFixed(1)} hours`
                        : value.toLocaleString();
                      
                      const colors: { [key: string]: string } = {
                        opened: '#3b82f6',
                        closed: '#10b981',
                        responseTime: '#f59e0b'
                      };
                      
                      const labels: { [key: string]: string } = {
                        opened: 'Opened',
                        closed: 'Closed',
                        responseTime: 'Avg Response Time'
                      };
                      
                      return [
                        <div key={name} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: colors[name as string] }}
                          />
                          <span className="font-semibold text-gray-900">{formattedValue}</span>
                        </div>,
                        labels[name as string]
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
                    yAxisId="left"
                    dataKey="opened" 
                    name="opened"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    label={renderCustomBarLabel}
                  />
                  
                  <Bar 
                    yAxisId="left"
                    dataKey="closed" 
                    name="closed"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    label={renderCustomBarLabel}
                  />
                  
                  <Line 
                    yAxisId="right"
                    type="monotone"
                    dataKey="responseTime" 
                    name="responseTime"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                  />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-4 justify-center mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Opened</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-gray-700">Closed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Response Time (h)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tickets Table */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Recent Tickets</h3>
              <div className="flex gap-2">
                <button className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                  <Filter size={14} />
                  Filter
                </button>
                <button className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticket ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ticketsData.slice(0, 10).map((ticket) => (
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
                      <td className="px-4 py-4 text-sm text-gray-700">{ticket.category}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{ticket.assignedTo}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketsTab;