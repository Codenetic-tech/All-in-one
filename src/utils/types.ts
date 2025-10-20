export interface TradeData {
  exchange: string;
  date: string;
  branch: string;
  clients?: string;
  buy_value?: string;
  sell_value?: string;
  total_value?: string;
  no_of_orders?: string;
  // Derivatives/Commodity fields
  option_lots?: string;
  option_volume?: string;
  future_volume?: string;
  no_of_trades?: string;
}

export interface ApiResponse {
  message: TradeData[];
}

export interface ProcessedBranchData {
  branch: string;
  clients: number;
  buyVal: number;
  sellVal: number;
  totalVal: number;
  orders: number;
}

export interface SummaryData {
  totalTrades: number;
  totalBranches: number;
  totalClients: number;
  totalOrders: number;
  totalVolume: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface QuickRange {
  label: string;
  days: number | string;
}

export interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export interface ExchangeData {
  name: string;
  trades: number;
  volume: number;
  orders: number;
  change: number;
}

export interface VolumeTrend {
  time: string;
  nse: number;
  nfo: number;
  mcx: number;
  bse: number;
  bfo: number;
}

export interface ProcessedDerivativesData {
  branch: string;
  clients: number;
  optionLots: number;
  optionVol: number;
  futureVol: number;
  trades: number;
  orders: number;
}

// Add these interfaces to types.ts
export interface BranchAllSegmentData {
  branch: string;
  nseVolume: number;
  bseVolume: number;
  nfoVolume: number;
  bfoVolume: number;
  mcxVolume: number;
  totalVolume: number;
  totalClients: number;
  totalOrders: number;
  totalTrades: number;
  nseClients: number;
  bseClients: number;
  nfoClients: number;
  bfoClients: number;
  mcxClients: number;
  nseOrders: number;
  bseOrders: number;
  nfoOrders: number;
  bfoOrders: number;
  mcxOrders: number;
}

export interface BranchPerformance {
  branch: string;
  clients: number;
  orders: number;
  volume: number;
  nseVolume: number;
  bseVolume: number;
  nfoVolume: number;
  bfoVolume: number;
  mcxVolume: number;
}


export const quickRanges: QuickRange[] = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: -1 },
  { label: 'Last 7 Days', days: -7 },
  { label: 'Last 30 Days', days: -30 },
  { label: 'This Month', days: 'currentMonth' },
  { label: 'Last Month', days: 'lastMonth' }
];

export const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// types.ts - Updated processTradeData function
export const processTradeData = (data: TradeData[]) => {
  console.log('Processing trade data:', data);
  
  // Initialize maps for all exchanges
  const nseBranchMap = new Map<string, ProcessedBranchData>();
  const bseBranchMap = new Map<string, ProcessedBranchData>();
  const nfoBranchMap = new Map<string, ProcessedDerivativesData>();
  const bfoBranchMap = new Map<string, ProcessedDerivativesData>();
  const mcxBranchMap = new Map<string, ProcessedDerivativesData>();

  data.forEach(item => {
    const clients = parseInt(item.clients || '0');
    const orders = parseInt(item.no_of_orders || '0');
    
    // Process based on exchange type
    switch (item.exchange) {
      case 'NSE':
      case 'BSE':
        // Cash segment processing
        const cashMap = item.exchange === 'NSE' ? nseBranchMap : bseBranchMap;
        const existingCash = cashMap.get(item.branch) || {
          branch: item.branch,
          clients: 0,
          buyVal: 0,
          sellVal: 0,
          totalVal: 0,
          orders: 0
        };
        
        existingCash.clients += clients;
        existingCash.buyVal += parseFloat(item.buy_value || '0');
        existingCash.sellVal += parseFloat(item.sell_value || '0');
        existingCash.totalVal += parseFloat(item.total_value || '0');
        existingCash.orders += orders;
        
        cashMap.set(item.branch, existingCash);
        break;

      case 'NFO':
      case 'BFO':
      case 'MCX':
        // Derivatives/Commodity processing
        let derivativesMap: Map<string, ProcessedDerivativesData>;
        switch (item.exchange) {
          case 'NFO': derivativesMap = nfoBranchMap; break;
          case 'BFO': derivativesMap = bfoBranchMap; break;
          case 'MCX': derivativesMap = mcxBranchMap; break;
          default: return;
        }
        
        const existingDerivatives = derivativesMap.get(item.branch) || {
          branch: item.branch,
          clients: 0,
          optionLots: 0,
          optionVol: 0,
          futureVol: 0,
          trades: 0,
          orders: 0
        };
        
        // FIX: Make sure we're properly adding clients
        existingDerivatives.clients += clients;
        existingDerivatives.optionLots += parseInt(item.option_lots || '0');
        existingDerivatives.optionVol += parseFloat(item.option_volume || '0');
        existingDerivatives.futureVol += parseFloat(item.future_volume || '0');
        existingDerivatives.trades += parseInt(item.no_of_trades || '0');
        existingDerivatives.orders += orders;
        
        derivativesMap.set(item.branch, existingDerivatives);
        break;
    }
  });

  // Calculate summary data
  const allBranches = new Set(data.map(item => item.branch));
  
  const totalTrades = data.reduce((sum, item) => 
    sum + parseInt(item.no_of_trades || '0'), 0
  );
  
  const totalOrders = data.reduce((sum, item) => 
    sum + parseInt(item.no_of_orders || '0'), 0
  );
  
  // Calculate total clients properly - count unique client-branch combinations
  const clientSet = new Set();
  data.forEach(item => {
    if (item.clients && item.clients !== '0') {
      clientSet.add(`${item.branch}-${item.clients}`);
    }
  });
  const totalClients = clientSet.size;

  // Calculate total volume - handle different exchange types
  const totalVolume = data.reduce((sum, item) => {
    if (item.exchange === 'NSE' || item.exchange === 'BSE') {
      return sum + parseFloat(item.total_value || '0');
    } else {
      return sum + parseFloat(item.option_volume || '0') + parseFloat(item.future_volume || '0');
    }
  }, 0);

  const summary: SummaryData = {
    totalTrades,
    totalBranches: allBranches.size,
    totalClients,
    totalOrders,
    totalVolume
  };

  console.log('Processed data:', { 
    nseData: Array.from(nseBranchMap.values()),
    bseData: Array.from(bseBranchMap.values()),
    nfoData: Array.from(nfoBranchMap.values()),
    bfoData: Array.from(bfoBranchMap.values()),
    mcxData: Array.from(mcxBranchMap.values()),
    summary
  });

  // DEBUG: Log client counts for each exchange
  console.log('Client counts by exchange:');
  console.log('NSE:', Array.from(nseBranchMap.values()).reduce((sum, item) => sum + item.clients, 0));
  console.log('BSE:', Array.from(bseBranchMap.values()).reduce((sum, item) => sum + item.clients, 0));
  console.log('NFO:', Array.from(nfoBranchMap.values()).reduce((sum, item) => sum + item.clients, 0));
  console.log('BFO:', Array.from(bfoBranchMap.values()).reduce((sum, item) => sum + item.clients, 0));
  console.log('MCX:', Array.from(mcxBranchMap.values()).reduce((sum, item) => sum + item.clients, 0));

  return {
    nseData: Array.from(nseBranchMap.values()),
    bseData: Array.from(bseBranchMap.values()),
    nfoData: Array.from(nfoBranchMap.values()),
    bfoData: Array.from(bfoBranchMap.values()),
    mcxData: Array.from(mcxBranchMap.values()),
    summary
  };
};

export const applyQuickRange = (range: QuickRange) => {
  const today = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (range.days === 'currentMonth') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (range.days === 'lastMonth') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (range.days === 0) {
    startDate = today;
    endDate = today;
  } else if (range.days === -1) {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);
  } else {
    startDate = new Date(today);
    startDate.setDate(today.getDate() + (range.days as number));
  }

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
};

export const branchPerformance = [
  { branch: 'DLHI', clients: 605, orders: 18667, volume: 320.12, revenue: 45.2 },
  { branch: 'DWAS', clients: 143, orders: 2791, volume: 89.45, revenue: 12.8 },
  { branch: 'SALM', clients: 231, orders: 5432, volume: 156.78, revenue: 22.4 },
  { branch: 'UJIN', clients: 189, orders: 4123, volume: 134.56, revenue: 18.9 },
  { branch: 'BNLR', clients: 12, orders: 1292, volume: 14.39, revenue: 2.1 }
];


// Add this function to types.ts to process branch data from all segments
export const processBranchAllSegmentData = (
  nseData: ProcessedBranchData[],
  bseData: ProcessedBranchData[],
  nfoData: ProcessedDerivativesData[],
  bfoData: ProcessedDerivativesData[],
  mcxData: ProcessedDerivativesData[]
): BranchAllSegmentData[] => {
  const branchMap = new Map<string, BranchAllSegmentData>();

  // Process NSE data
  nseData.forEach(item => {
    const existing = branchMap.get(item.branch) || createEmptyBranchData(item.branch);
    existing.nseVolume += item.totalVal;
    existing.nseClients += item.clients;
    existing.nseOrders += item.orders;
    existing.totalClients += item.clients;
    existing.totalOrders += item.orders;
    existing.totalVolume += item.totalVal;
    branchMap.set(item.branch, existing);
  });

  // Process BSE data
  bseData.forEach(item => {
    const existing = branchMap.get(item.branch) || createEmptyBranchData(item.branch);
    existing.bseVolume += item.totalVal;
    existing.bseClients += item.clients;
    existing.bseOrders += item.orders;
    existing.totalClients += item.clients;
    existing.totalOrders += item.orders;
    existing.totalVolume += item.totalVal;
    branchMap.set(item.branch, existing);
  });

  // Process NFO data
  nfoData.forEach(item => {
    const existing = branchMap.get(item.branch) || createEmptyBranchData(item.branch);
    const segmentVolume = item.optionVol + item.futureVol;
    existing.nfoVolume += segmentVolume;
    existing.nfoClients += item.clients;
    existing.nfoOrders += item.orders;
    existing.totalClients += item.clients;
    existing.totalOrders += item.orders;
    existing.totalVolume += segmentVolume;
    existing.totalTrades += item.trades;
    branchMap.set(item.branch, existing);
  });

  // Process BFO data
  bfoData.forEach(item => {
    const existing = branchMap.get(item.branch) || createEmptyBranchData(item.branch);
    const segmentVolume = item.optionVol + item.futureVol;
    existing.bfoVolume += segmentVolume;
    existing.bfoClients += item.clients;
    existing.bfoOrders += item.orders;
    existing.totalClients += item.clients;
    existing.totalOrders += item.orders;
    existing.totalVolume += segmentVolume;
    existing.totalTrades += item.trades;
    branchMap.set(item.branch, existing);
  });

  // Process MCX data
  mcxData.forEach(item => {
    const existing = branchMap.get(item.branch) || createEmptyBranchData(item.branch);
    const segmentVolume = item.optionVol + item.futureVol;
    existing.mcxVolume += segmentVolume;
    existing.mcxClients += item.clients;
    existing.mcxOrders += item.orders;
    existing.totalClients += item.clients;
    existing.totalOrders += item.orders;
    existing.totalVolume += segmentVolume;
    existing.totalTrades += item.trades;
    branchMap.set(item.branch, existing);
  });

  return Array.from(branchMap.values()).sort((a, b) => b.totalVolume - a.totalVolume);
};

const createEmptyBranchData = (branch: string): BranchAllSegmentData => ({
  branch,
  nseVolume: 0,
  bseVolume: 0,
  nfoVolume: 0,
  bfoVolume: 0,
  mcxVolume: 0,
  totalVolume: 0,
  totalClients: 0,
  totalOrders: 0,
  totalTrades: 0,
  nseClients: 0,
  bseClients: 0,
  nfoClients: 0,
  bfoClients: 0,
  mcxClients: 0,
  nseOrders: 0,
  bseOrders: 0,
  nfoOrders: 0,
  bfoOrders: 0,
  mcxOrders: 0
});

// Update the branchPerformance to use actual data
export const getBranchPerformance = (branchData: BranchAllSegmentData[]): BranchPerformance[] => {
  return branchData.map(branch => ({
    branch: branch.branch,
    clients: branch.totalClients,
    orders: branch.totalOrders,
    volume: branch.totalVolume,
    nseVolume: branch.nseVolume,
    bseVolume: branch.bseVolume,
    nfoVolume: branch.nfoVolume,
    bfoVolume: branch.bfoVolume,
    mcxVolume: branch.mcxVolume
  }));
};
