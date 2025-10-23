// SummaryCard.tsx
import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo' | 'teal' | 'pink' | 'yellow';
  shadowColor?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo' | 'teal' | 'pink' | 'gray' | 'yellow';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  showTrend?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    iconBg: 'bg-blue-500',
    trendBg: 'bg-blue-100',
    trendText: 'text-blue-600',
    hoverGradient: 'hover:from-blue-500 hover:to-blue-600',
  },
  green: {
    iconBg: 'bg-green-500',
    trendBg: 'bg-green-100',
    trendText: 'text-green-600',
    hoverGradient: 'hover:from-green-500 hover:to-green-600',
  },
  orange: {
    iconBg: 'bg-orange-500',
    trendBg: 'bg-orange-100',
    trendText: 'text-orange-600',
    hoverGradient: 'hover:from-orange-500 hover:to-orange-600',
  },
  purple: {
    iconBg: 'bg-purple-500',
    trendBg: 'bg-purple-100',
    trendText: 'text-purple-600',
    hoverGradient: 'hover:from-purple-500 hover:to-purple-600',
  },
  red: {
    iconBg: 'bg-red-500',
    trendBg: 'bg-red-100',
    trendText: 'text-red-600',
    hoverGradient: 'hover:from-red-500 hover:to-red-600',
  },
  indigo: {
    iconBg: 'bg-indigo-500',
    trendBg: 'bg-indigo-100',
    trendText: 'text-indigo-600',
    hoverGradient: 'hover:from-indigo-500 hover:to-indigo-600',
  },
  teal: {
    iconBg: 'bg-teal-500',
    trendBg: 'bg-teal-100',
    trendText: 'text-teal-600',
    hoverGradient: 'hover:from-teal-500 hover:to-teal-600',
  },
  pink: {
    iconBg: 'bg-pink-500',
    trendBg: 'bg-pink-100',
    trendText: 'text-pink-600',
    hoverGradient: 'hover:from-pink-500 hover:to-pink-600',
  },
  yellow: {
    iconBg: 'bg-yellow-500',
    trendBg: 'bg-yellow-100',
    trendText: 'text-yellow-600',
    hoverGradient: 'hover:from-yellow-500 hover:to-yellow-600',
  }
};

const shadowClasses = {
  blue: 'shadow-lg shadow-blue-100 hover:shadow-blue-500/40',
  green: 'shadow-lg shadow-green-100 hover:shadow-green-500/40',
  orange: 'shadow-lg shadow-orange-100 hover:shadow-orange-500/40',
  purple: 'shadow-lg shadow-purple-100 hover:shadow-purple-500/40',
  red: 'shadow-lg shadow-red-100 hover:shadow-red-500/40',
  indigo: 'shadow-lg shadow-indigo-100 hover:shadow-indigo-500/40',
  teal: 'shadow-lg shadow-teal-100 hover:shadow-teal-500/40',
  pink: 'shadow-lg shadow-pink-100 hover:shadow-pink-500/40',
  gray: 'shadow-lg shadow-gray-100 hover:shadow-gray-500/40',
  yellow: 'shadow-lg shadow-yellow-100 hover:shadow-yellow-500/40'
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  shadowColor,
  trend,
  showTrend = false,
  prefix = '',
  suffix = '',
  className = '',
  onClick
}) => {
  const colors = colorClasses[color];
  const shadow = shadowClasses[shadowColor || color]; // Use shadowColor if provided, else fallback to color

  return (
    <div 
      className={`
        bg-white rounded-xl p-6 text-gray-800 transition-all duration-300 
        hover:bg-gradient-to-br hover:text-white hover:shadow-2xl
        ${colors.hoverGradient} ${shadow}
        group cursor-pointer ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`${colors.iconBg} p-2 rounded-lg transition-colors duration-300 group-hover:bg-white/20 backdrop-blur-sm`}>
          <Icon size={24} className="text-white" />
        </div>
        
        {showTrend && trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${colors.trendBg} ${colors.trendText} px-2 py-1 rounded-full group-hover:bg-white/20 group-hover:text-white`}>
            {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.value}%
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-medium opacity-90 mb-1">{title}</h3>
      <p className="text-2xl font-bold">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
    </div>
  );
};

// Optional: SummaryCardsGrid component for easy layout
interface SummaryCardsGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const SummaryCardsGrid: React.FC<SummaryCardsGridProps> = ({ 
  children, 
  className = '',
  columns = 5
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
};