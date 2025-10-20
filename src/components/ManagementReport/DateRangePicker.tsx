import React, { useState } from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { DateRange, QuickRange } from '@/utils/types';
import { quickRanges, formatDate, applyQuickRange } from '@/utils/types';

interface DateRangePickerProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  loading: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  setDateRange,
  loading
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleApplyQuickRange = (range: QuickRange) => {
    const newDateRange = applyQuickRange(range);
    setDateRange(newDateRange);
    setShowDatePicker(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-blue-50 p-6 mb-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
            <Calendar className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date Range</h3>
            <p className="text-lg font-bold text-gray-800">
              {dateRange.start ? formatDate(dateRange.start) : ''} - {dateRange.end ? formatDate(dateRange.end) : ''}
            </p>
            {loading && (
              <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading data...
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Quick Range Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickRanges.slice(0, 4).map((range) => (
              <button
                key={range.label}
                onClick={() => handleApplyQuickRange(range)}
                disabled={loading}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg min-w-[140px] justify-center disabled:opacity-50"
            >
              <Calendar size={16} />
              Custom Range
              <ChevronDown size={16} className={`transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Date Picker */}
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[320px] animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Select Date Range</h4>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {quickRanges.slice(4).map((range) => (
                    <button
                      key={range.label}
                      onClick={() => handleApplyQuickRange(range)}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;