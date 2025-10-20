// components/ManagementReport/OverviewTab.tsx
import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, Package, Building2, IndianRupee, ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3 } from 'lucide-react';
import { 
  SummaryData, 
  ExchangeData, 
  ProcessedBranchData, 
  ProcessedDerivativesData 
} from '@/utils/types';

interface OverviewTabProps {
  summaryData: SummaryData;
  isInitialLoading: boolean;
  nseData: ProcessedBranchData[];
  bseData: ProcessedBranchData[];
  nfoData: ProcessedDerivativesData[];
  bfoData: ProcessedDerivativesData[];
  mcxData: ProcessedDerivativesData[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  summaryData, 
  isInitialLoading, 
  nseData, 
  bseData,
  nfoData,
  bfoData,
  mcxData
}) => {
  // Calculate real data for all exchanges
  const exchangeData: ExchangeData[] = [
    { 
      name: 'NSE', 
      trades: nseData.reduce((sum, item) => sum + item.orders, 0), 
      volume: nseData.reduce((sum, item) => sum + item.totalVal, 0), 
      orders: nseData.reduce((sum, item) => sum + item.orders, 0), 
      change: 12.5 
    },
    { 
      name: 'BSE', 
      trades: bseData.reduce((sum, item) => sum + item.orders, 0), 
      volume: bseData.reduce((sum, item) => sum + item.totalVal, 0), 
      orders: bseData.reduce((sum, item) => sum + item.orders, 0), 
      change: -3.2 
    },
    { 
      name: 'NFO', 
      trades: nfoData.reduce((sum, item) => sum + item.trades, 0), 
      volume: nfoData.reduce((sum, item) => sum + item.optionVol + item.futureVol, 0), 
      orders: nfoData.reduce((sum, item) => sum + item.orders, 0), 
      change: 18.7 
    },
    { 
      name: 'BFO', 
      trades: bfoData.reduce((sum, item) => sum + item.trades, 0), 
      volume: bfoData.reduce((sum, item) => sum + item.optionVol + item.futureVol, 0), 
      orders: bfoData.reduce((sum, item) => sum + item.orders, 0), 
      change: 8.4 
    },
    { 
      name: 'MCX', 
      trades: mcxData.reduce((sum, item) => sum + item.trades, 0), 
      volume: mcxData.reduce((sum, item) => sum + item.optionVol + item.futureVol, 0), 
      orders: mcxData.reduce((sum, item) => sum + item.orders, 0), 
      change: 15.3 
    }
  ];

  // Calculate total values for summary cards
  const totalTrades = [...nfoData, ...bfoData, ...mcxData].reduce((sum, exchange) => sum + exchange.trades, 0);
  const totalVolume = exchangeData.reduce((sum, exchange) => sum + exchange.volume, 0);
  const totalOrders = [...nseData, ...bseData, ...nfoData, ...bfoData, ...mcxData].reduce((sum, exchange) => sum + exchange.orders, 0);
  const totalClients = [...nseData, ...bseData, ...nfoData, ...bfoData, ...mcxData].reduce((sum, item) => sum + item.clients, 0);

  
  // Get unique branches from all exchanges
  const allBranches = new Set([
    ...nseData.map(item => item.branch),
    ...bseData.map(item => item.branch),
    ...nfoData.map(item => item.branch),
    ...bfoData.map(item => item.branch),
    ...mcxData.map(item => item.branch)
  ]);

  // Chart data for exchange performance comparison
  const performanceChartData = exchangeData.map(exchange => ({
    name: exchange.name,
    trades: exchange.trades,
    orders: exchange.orders,
    volume: exchange.volume / 100, // Convert to Cr
    volumeRaw: exchange.volume
  }));

  // Custom bar chart with multiple metrics
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
        {value > 1000 ? `${(value / 1000).toFixed(0)}K` : value.toLocaleString()}
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
              <Activity size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              12.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-80 mb-1">Total Income</h3>
          <p className="text-2xl font-bold">₹ {totalTrades.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-blue-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Users size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              8.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Direct Net Income</h3>
          <p className="text-2xl font-bold">₹ {totalClients.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-blue-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Package size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              5.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Indirect Net Income</h3>
          <p className="text-2xl font-bold">₹ {totalOrders.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-blue-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Building2 size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              8.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">AUM</h3>
          <p className="text-2xl font-bold">₹ {totalTrades.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-blue-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Building2 size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              8.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Payout</h3>
          <p className="text-2xl font-bold">₹ {totalTrades.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-blue-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <IndianRupee size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              8.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Revenue Incentive</h3>
          <p className="text-2xl font-bold">₹ {(totalVolume / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Charts Row - Only show when data is loaded */}
      {!isInitialLoading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exchange Distribution Pie Chart */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Exchange Distribution</h3>
                  <p className="text-sm text-gray-500">Trading volume across platforms</p>
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  <span className="text-sm font-semibold text-blue-700">
                    {exchangeData.length} Exchanges
                  </span>
                </div>
              </div>

              <div className="relative">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={exchangeData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="volume"
                      nameKey="name"
                      label={({ name, percent }) => 
                        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {exchangeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={[
                            "#3b82f6", // blue-500 - NSE
                            "#10b981", // green-500 - BSE
                            "#f59e0b", // yellow-500 - NFO
                            "#ef4444", // red-500 - BFO
                            "#8b5cf6", // purple-500 - MCX
                          ][index % 5]}
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
                      {(totalVolume / 100).toFixed(2)}
                    </text>
                    <text 
                      x="50%" 
                      y="55%" 
                      textAnchor="middle" 
                      className="text-sm fill-gray-500"
                    >
                      Total Volume (Cr)
                    </text>

                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '1rem'
                      }}
                      itemStyle={{
                        color: '#1f2937',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                      labelStyle={{
                        color: '#111827',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}
                      formatter={(value, name, props) => {
                        const percentage = ((Number(value) / totalVolume) * 100).toFixed(1);
                        return [
                          <div key="value" className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: props.color }}
                            />
                            <span className="font-semibold text-gray-900">
                              ₹{(Number(value) / 100).toFixed(2)} Cr
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
                {exchangeData.map((entry, index) => {
                  const colors = [
                    "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500"
                  ];
                  const percentage = ((entry.volume / totalVolume) * 100).toFixed(1);
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                      <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                      <span className="text-sm text-gray-500 font-medium">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exchange Performance Bar Chart */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    Exchange Performance
                  </h3>
                  <p className="text-sm text-gray-500">Trades, Orders & Volume comparison</p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      <BarChart3 size={14} />
                      Metrics
                    </span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
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
                    yAxisId="left"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()}
                  />
                  
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `₹${value}`}
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
                      const formattedValue = name === 'volume' 
                        ? `₹${Number(value).toFixed(2)} Cr`
                        : value.toLocaleString();
                      
                      const colors: { [key: string]: string } = {
                        trades: '#3b82f6',
                        orders: '#10b981',
                        volume: '#f59e0b'
                      };
                      
                      const labels: { [key: string]: string } = {
                        trades: 'Trades',
                        orders: 'Orders',
                        volume: 'Volume'
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
                    dataKey="trades" 
                    name="trades"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    label={renderCustomBarLabel}
                  />
                  
                  <Bar 
                    yAxisId="left"
                    dataKey="orders" 
                    name="orders"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    label={renderCustomBarLabel}
                  />
                  
                  <Bar 
                    yAxisId="right"
                    dataKey="volume" 
                    name="volume"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    label={renderCustomBarLabel}
                  />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-4 justify-center mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Trades</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-gray-700">Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Volume (Cr)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Performance Table */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Exchange Performance Summary</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Exchange</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Trades</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Orders</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Volume (Cr)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exchangeData.map((exchange, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{exchange.name}</td>
                      <td className="px-4 py-4 text-sm text-right text-gray-700">{exchange.trades.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-right text-gray-700">{exchange.orders.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-right text-gray-700">{(exchange.volume / 100).toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold ${exchange.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {exchange.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {Math.abs(exchange.change)}%
                        </span>
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

export default OverviewTab;