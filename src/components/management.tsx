// management.tsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Users, Activity, DollarSign, Package, ArrowUpRight, ArrowDownRight, Download, Filter, Search, Building2, Briefcase, TrendingDown, ChevronDown, User, IndianRupee, RefreshCw } from 'lucide-react';

import { 
  TradeData, 
  ApiResponse, 
  ProcessedBranchData, 
  ProcessedDerivativesData,
  SummaryData, 
  DateRange, 
  Tab,
} from '@/utils/types';
import {
  COLORS,
  processTradeData,
  processBranchAllSegmentData,
  getBranchPerformance
} from '@/utils/types';
import DateRangePicker from '@/components/ManagementReport/DateRangePicker';
import OverviewTab from '@/components/ManagementReport/OverviewTab';

const Incentive: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: '',
    end: ''
  });
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with empty/zero data
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalTrades: 0,
    totalBranches: 0,
    totalClients: 0,
    totalOrders: 0,
    totalVolume: 0
  });

  const [nseData, setNseData] = useState<ProcessedBranchData[]>([]);
  const [bseData, setBseData] = useState<ProcessedBranchData[]>([]);
  const [nfoData, setNfoData] = useState<ProcessedDerivativesData[]>([]);
  const [bfoData, setBfoData] = useState<ProcessedDerivativesData[]>([]);
  const [mcxData, setMcxData] = useState<ProcessedDerivativesData[]>([]);

  // Initialize default date range (start of current month to today)
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

  // Fetch data when dateRange changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchTradeData();
    }
  }, [dateRange]);

  const fetchTradeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://n8n.gopocket.in/webhook/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'getreport',
          start_date: dateRange.start,
          end_date: dateRange.end
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data: ApiResponse[] = await response.json();
      
      if (data && data[0] && data[0].message) {
        setTradeData(data[0].message);
        const processed = processTradeData(data[0].message);
        setNseData(processed.nseData);
        setBseData(processed.bseData);
        setNfoData(processed.nfoData);
        setBfoData(processed.bfoData);
        setMcxData(processed.mcxData);
        setSummaryData(processed.summary);
      } else {
        setTradeData([]);
        const processed = processTradeData([]);
        setNseData(processed.nseData);
        setBseData(processed.bseData);
        setSummaryData(processed.summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching trade data:', err);
      // Use fallback data on error
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  const tabs: Tab[] = [
    { id: 'overview', label: 'Revenue Incentive', icon: Activity },
    { id: 'nse-bse', label: 'Login Incentive', icon: TrendingUp },
    { id: 'derivatives', label: 'Active Clients', icon: TrendingUp },
    { id: 'commodity', label: 'Referral Partners', icon: Package },
    { id: 'branches', label: 'Leader Board', icon: Building2 }
  ];

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading Incentive data...</p>
      </div>
    </div>
  );

  // Calculate MCX stats from actual data
  const mcxTotalTrades = mcxData.reduce((sum, item) => sum + item.trades, 0);
  const mcxTotalClients = mcxData.reduce((sum, item) => sum + item.clients, 0);
  const mcxTotalOrders = mcxData.reduce((sum, item) => sum + item.orders, 0);
  const mcxTotalVolume = mcxData.reduce((sum, item) => sum + item.optionVol + item.futureVol, 0);

  // Calculate NFO stats
  const nfoTotalTrades = nfoData.reduce((sum, item) => sum + item.trades, 0);
  const nfoTotalClients = nfoData.reduce((sum, item) => sum + item.clients, 0);
  const nfoTotalOrders = nfoData.reduce((sum, item) => sum + item.orders, 0);
  const nfoTotalVolume = nfoData.reduce((sum, item) => sum + item.optionVol + item.futureVol, 0);

  // Calculate BFO stats
  const bfoTotalTrades = bfoData.reduce((sum, item) => sum + item.trades, 0);
  const bfoTotalClients = bfoData.reduce((sum, item) => sum + item.clients, 0);
  const bfoTotalOrders = bfoData.reduce((sum, item) => sum + item.orders, 0);
  const bfoTotalVolume = bfoData.reduce((sum, item) => sum + item.optionVol + item.futureVol, 0);

  const renderNseBseTab = () => {
  // Calculate totals from NSE and BSE data
  const totalOrders = [...nseData, ...bseData].reduce((sum, item) => sum + item.orders, 0);
  const totalBuyValue = [...nseData, ...bseData].reduce((sum, item) => sum + item.buyVal, 0);
  const totalSellValue = [...nseData, ...bseData].reduce((sum, item) => sum + item.sellVal, 0);
  const totalValue = totalBuyValue + totalSellValue;
  const totalClients = [...nseData, ...bseData].reduce((sum, item) => sum + item.clients, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Clients */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-orange-500 hover:to-orange-600 hover:text-white hover:shadow-orange-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Users size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              4.7%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Clients</h3>
          <p className="text-2xl font-bold">{totalClients.toLocaleString()}</p>
        </div>

        {/* Total Orders */}
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
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Orders</h3>
          <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
        </div>

        {/* Total Buy Value */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 hover:text-white hover:shadow-green-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              8.5%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Buy Value (Cr)</h3>
          <p className="text-2xl font-bold">₹{(totalBuyValue / 100).toFixed(2)}</p>
        </div>

        {/* Total Sell Value */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-red-500 hover:to-red-600 hover:text-white hover:shadow-red-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <TrendingDown size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded-full">
              <ArrowDownRight size={14} />
              3.2%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Sell Value (Cr)</h3>
          <p className="text-2xl font-bold">₹{(totalSellValue / 100).toFixed(2)}</p>
        </div>

        {/* Total Value */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-500 hover:to-purple-600 hover:text-white hover:shadow-purple-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <IndianRupee size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              6.8%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Value (Cr)</h3>
          <p className="text-2xl font-bold">₹{(totalValue / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Data tables - only show when data is loaded */}
      {!isInitialLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* NSE Data */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">NSE Branch Summary</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Cash</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Branch</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Clients</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Buy</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Sell</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {nseData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">{item.branch}</td>
                      <td className="px-3 py-3 text-sm text-right text-gray-700">{item.clients}</td>
                      <td className="px-3 py-3 text-sm text-right text-green-600">₹{item.buyVal.toFixed(2)}</td>
                      <td className="px-3 py-3 text-sm text-right text-red-600">₹{item.sellVal.toFixed(2)}</td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-gray-900">₹{item.totalVal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BSE Data */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">BSE Branch Summary</h3>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Cash</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Branch</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Clients</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Buy</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Sell</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bseData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">{item.branch}</td>
                      <td className="px-3 py-3 text-sm text-right text-gray-700">{item.clients}</td>
                      <td className="px-3 py-3 text-sm text-right text-green-600">₹{item.buyVal.toFixed(2)}</td>
                      <td className="px-3 py-3 text-sm text-right text-red-600">₹{item.sellVal.toFixed(2)}</td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-gray-900">₹{item.totalVal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const renderDerivativesTab = () => {
  // Calculate totals for NFO and BFO combined
  const totalClients = nfoTotalClients + bfoTotalClients;
  const totalOptionLots = nfoData.reduce((sum, item) => sum + item.optionLots, 0) + bfoData.reduce((sum, item) => sum + item.optionLots, 0);
  const totalOptionVolume = nfoData.reduce((sum, item) => sum + item.optionVol, 0) + bfoData.reduce((sum, item) => sum + item.optionVol, 0);
  const totalFutureVolume = nfoData.reduce((sum, item) => sum + item.futureVol, 0) + bfoData.reduce((sum, item) => sum + item.futureVol, 0);
  const totalTrades = nfoTotalTrades + bfoTotalTrades;
  const totalOrders = nfoTotalOrders + bfoTotalOrders;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Clients */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-orange-500 hover:to-orange-600 hover:text-white hover:shadow-orange-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Users size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              4.7%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Clients</h3>
          <p className="text-2xl font-bold">{totalClients.toLocaleString()}</p>
        </div>

        {/* Total Option Lots */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-blue-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Package size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              12.3%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Option Lots</h3>
          <p className="text-2xl font-bold">{totalOptionLots.toLocaleString()}</p>
        </div>

        {/* Total Option Volume */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 hover:text-white hover:shadow-green-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              15.7%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Option Volume (Cr)</h3>
          <p className="text-2xl font-bold">₹{(totalOptionVolume / 100).toFixed(2)}</p>
        </div>

        {/* Total Future Volume */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-cyan-500 hover:to-cyan-600 hover:text-white hover:shadow-cyan-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-cyan-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Activity size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-cyan-100 text-cyan-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              11.2%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Future Volume (Cr)</h3>
          <p className="text-2xl font-bold">₹{(totalFutureVolume / 100).toFixed(2)}</p>
        </div>

        {/* Total No of Trades */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-red-500 hover:to-red-600 hover:text-white hover:shadow-red-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              15.2%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Trades</h3>
          <p className="text-2xl font-bold">{totalTrades.toLocaleString()}</p>
        </div>

        {/* Total No of Orders */}
        <div className="bg-white rounded-xl shadow-lg shadow-blue-100 p-6 text-gray-800 transition-all duration-300 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-indigo-600 hover:text-white hover:shadow-indigo-500/40 group">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-indigo-500 p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm">
              <Briefcase size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} />
              7.3%
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Orders</h3>
          <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
        </div>
      </div>

      {/* Rest of the NFO BFO tab content remains the same */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NFO Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">NFO Summary Report</h3>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">F&O</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Branch</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Clients</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Option Lots</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Option Vol (LKS)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Future Vol (LKS)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Trades</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nfoData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.branch}</td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700">{item.clients.toLocaleString()}</td> {/* Clients data */}
                    <td className="px-4 py-4 text-sm text-right text-blue-600">{item.optionLots.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700">₹{item.optionVol.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700">₹{item.futureVol.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700">{item.trades.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900">{item.orders.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BFO Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">BFO Summary Report</h3>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">F&O</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Branch</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Clients</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Option Lots</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Option Vol (LKS)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Future Vol (LKS)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Trades</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bfoData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.branch}</td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700">{item.clients.toLocaleString()}</td> {/* Clients data */}
                    <td className="px-4 py-4 text-sm text-right text-blue-600">{item.optionLots.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700">₹{item.optionVol.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700">₹{item.futureVol.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700">{item.trades.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900">{item.orders.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">NFO vs BFO Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={[...nfoData, ...bfoData.map(d => ({...d, branch: d.branch + '-BFO'}))]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="branch" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Legend />
            <Bar dataKey="optionLots" fill="#8b5cf6" name="Option Lots" />
            <Bar dataKey="trades" fill="#ec4899" name="Trades" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

  const renderCommodityTab = () => {
  // Calculate MCX totals
  const mcxTotalClients = mcxData.reduce((sum, item) => sum + item.clients, 0);
  const mcxTotalOptionLots = mcxData.reduce((sum, item) => sum + item.optionLots, 0);
  const mcxTotalOptionVolume = mcxData.reduce((sum, item) => sum + item.optionVol, 0);
  const mcxTotalFutureVolume = mcxData.reduce((sum, item) => sum + item.futureVol, 0);
  const mcxTotalTrades = mcxData.reduce((sum, item) => sum + item.trades, 0);
  const mcxTotalOrders = mcxData.reduce((sum, item) => sum + item.orders, 0);

  return (
    <div className="space-y-6">
      {/* MCX Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Clients */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Users className="text-white" size={20} />
            </div>
            <span className="text-xs font-semibold text-amber-700">Total Clients</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{mcxTotalClients.toLocaleString()}</p>
          <p className="text-xs text-amber-600 mt-1">MCX Segment</p>
        </div> 

        {/* Total Option Lots */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Package className="text-white" size={20} />
            </div>
            <span className="text-xs font-semibold text-orange-700">Option Lots</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{mcxTotalOptionLots.toLocaleString()}</p>
          <p className="text-xs text-orange-600 mt-1">Total Lots</p>
        </div>

        {/* Total Option Volume */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-500 p-2 rounded-lg">
              <TrendingUp className="text-white" size={20} />
            </div>
            <span className="text-xs font-semibold text-red-700">Option Volume</span>
          </div>
          <p className="text-2xl font-bold text-red-900">₹{(mcxTotalOptionVolume / 100).toFixed(2)} Cr</p>
          <p className="text-xs text-red-600 mt-1">MCX Options</p>
        </div>

        {/* Total Future Volume */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Activity className="text-white" size={20} />
            </div>
            <span className="text-xs font-semibold text-yellow-700">Future Volume</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">₹{(mcxTotalFutureVolume / 100).toFixed(2)} Cr</p>
          <p className="text-xs text-yellow-600 mt-1">MCX Futures</p>
        </div>

        {/* Total No of Trades */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500 p-2 rounded-lg">
              <TrendingUp className="text-white" size={20} />
            </div>
            <span className="text-xs font-semibold text-green-700">Total Trades</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{mcxTotalTrades.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">Trade Count</p>
        </div>

        {/* Total No of Orders */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Briefcase className="text-white" size={20} />
            </div>
            <span className="text-xs font-semibold text-blue-700">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{mcxTotalOrders.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-1">Order Count</p>
        </div>
      </div>

      {/* Rest of the commodity tab content remains the same */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">MCX Summary Report</h3>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Commodity</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Branch</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Clients</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Option Lots</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Option Vol (LKS)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Future Vol (LKS)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Trades</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mcxData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.branch}</td>
                  <td className="px-4 py-4 text-sm text-right text-gray-700">{item.clients.toLocaleString()}</td> {/* Clients data */}
                  <td className="px-4 py-4 text-sm text-right text-blue-600">{item.optionLots.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-right text-gray-700">₹{item.optionVol.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-right text-gray-700">₹{item.futureVol.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-right text-gray-900">{item.trades.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900">{item.orders.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MCX Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Branch-wise MCX Trading</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={mcxData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="branch" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Bar dataKey="trades" fill="#f59e0b" name="Trades" />
              <Bar dataKey="orders" fill="#ef4444" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Option vs Future Volume</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={mcxData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="branch" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="optionVol" stroke="#8b5cf6" strokeWidth={2} name="Option Volume" />
              <Line type="monotone" dataKey="futureVol" stroke="#10b981" strokeWidth={2} name="Future Volume" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

  // In management.tsx, update the renderBranchesTab function:

const renderBranchesTab = () => {
  // Process branch data from all segments
  const branchAllSegmentData = processBranchAllSegmentData(nseData, bseData, nfoData, bfoData, mcxData);
  const branchPerformanceData = getBranchPerformance(branchAllSegmentData);

  // Calculate totals for summary cards
  const totalVolume = branchAllSegmentData.reduce((sum, branch) => sum + branch.totalVolume, 0);

  return (
    <div className="space-y-6">
      {/* Top 3 Branches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branchPerformanceData.slice(0, 3).map((branch, idx) => (
          <div key={idx} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Building2 size={24} />
              </div>
              <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                #{idx + 1}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{branch.branch}</h3>
            <p className="text-sm opacity-90 mb-4">{branch.clients} Active Clients</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="opacity-80">Orders</p>
                <p className="font-semibold">{branch.orders.toLocaleString()}</p>
              </div>
              <div>
                <p className="opacity-80">Volume</p>
                <p className="font-semibold">₹{(branch.volume / 100).toFixed(2)} Cr</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Performance Table */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">All Branches Performance - All Segments</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Download size={14} className="inline mr-1" />
              Export
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Filter size={14} className="inline mr-1" />
              Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Branch</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Clients</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">NSE Vol (Cr)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">BSE Vol (Cr)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">NFO Vol (Cr)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">BFO Vol (Cr)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">MCX Vol (Cr)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Vol (Cr)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {branchAllSegmentData.map((branch, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                        {branch.branch.slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{branch.branch}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-gray-700">{branch.totalClients}</td>
                  <td className="px-4 py-4 text-sm text-right text-gray-700">{branch.totalOrders.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-right text-blue-600">₹{(branch.nseVolume / 100).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-right text-green-600">₹{(branch.bseVolume / 100).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-right text-purple-600">₹{(branch.nfoVolume / 100).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-right text-pink-600">₹{(branch.bfoVolume / 100).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-right text-amber-600">₹{(branch.mcxVolume / 100).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900">₹{(branch.totalVolume / 100).toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          style={{ width: `${Math.min((branch.totalVolume / (totalVolume / branchAllSegmentData.length)) * 50, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {Math.round((branch.totalVolume / totalVolume) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Branch Volume Comparison</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={branchPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="branch" type="category" stroke="#9ca3af" />
              <Tooltip 
                formatter={(value) => [`₹${(Number(value) / 100).toFixed(2)} Cr`, 'Volume']}
              />
              <Bar dataKey="volume" fill="#6366f1" radius={[0, 8, 8, 0]} name="Total Volume" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Segment-wise Volume Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={branchPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="branch" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                formatter={(value) => [`₹${(Number(value) / 100).toFixed(2)} Cr`, 'Volume']}
              />
              <Legend />
              <Bar dataKey="nseVolume" stackId="a" fill="#3b82f6" name="NSE" />
              <Bar dataKey="bseVolume" stackId="a" fill="#10b981" name="BSE" />
              <Bar dataKey="nfoVolume" stackId="a" fill="#8b5cf6" name="NFO" />
              <Bar dataKey="bfoVolume" stackId="a" fill="#ec4899" name="BFO" />
              <Bar dataKey="mcxVolume" stackId="a" fill="#f59e0b" name="MCX" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segment Distribution Pie Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Segment Distribution</h3>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={[
                { name: 'NSE', value: branchAllSegmentData.reduce((sum, branch) => sum + branch.nseVolume, 0) },
                { name: 'BSE', value: branchAllSegmentData.reduce((sum, branch) => sum + branch.bseVolume, 0) },
                { name: 'NFO', value: branchAllSegmentData.reduce((sum, branch) => sum + branch.nfoVolume, 0) },
                { name: 'BFO', value: branchAllSegmentData.reduce((sum, branch) => sum + branch.bfoVolume, 0) },
                { name: 'MCX', value: branchAllSegmentData.reduce((sum, branch) => sum + branch.mcxVolume, 0) }
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#3b82f6" />
              <Cell fill="#10b981" />
              <Cell fill="#8b5cf6" />
              <Cell fill="#ec4899" />
              <Cell fill="#f59e0b" />
            </Pie>
            <Tooltip 
              formatter={(value) => [`₹${(Number(value) / 100).toFixed(2)} Cr`, 'Volume']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
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
            <OverviewTab 
              summaryData={summaryData}
              isInitialLoading={isInitialLoading}
              nseData={nseData}
              bseData={bseData}
              nfoData={nfoData}
              bfoData={bfoData}
              mcxData={mcxData}
            />
          )}
          {activeTab === 'nse-bse' && renderNseBseTab()}
          {activeTab === 'derivatives' && renderDerivativesTab()}
          {activeTab === 'commodity' && renderCommodityTab()}
          {activeTab === 'branches' && renderBranchesTab()}
        </div>
      </div>
    </div>
  );
};

export default Incentive;