// Add to your existing types.ts file

export interface TicketData {
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

export interface TicketsTabProps {
  ticketsData: TicketData[];
  isInitialLoading: boolean;
}