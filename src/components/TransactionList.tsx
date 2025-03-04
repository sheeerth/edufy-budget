'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, DateRange } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<'all' | 'profit' | 'cost'>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Apply filters
    let filtered = [...transactions];

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filter);
    }

    // Apply date filter
    if (dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Set to end of day

      filtered = filtered.filter(transaction => {
        const txDate = new Date(transaction.date);
        return txDate >= startDate && txDate <= endDate;
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, filter, dateRange]);

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearDateFilter = () => {
    setDateRange({
      startDate: '',
      endDate: ''
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <div className="p-6 bg-gray-50 rounded-md text-gray-500 text-center">
          No transactions found. Add your first transaction using the form.
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalProfit = filteredTransactions
    .filter(t => t.type === 'profit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCost = filteredTransactions
    .filter(t => t.type === 'cost')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'profit' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('profit')}
          >
            Profits
          </button>
          <button
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'cost' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('cost')}
          >
            Costs
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="txStartDate" className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                id="txStartDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateFilterChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="txEndDate" className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                id="txEndDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateFilterChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <button
              onClick={clearDateFilter}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {dateRange.startDate && dateRange.endDate && (
        <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded-md text-sm">
          Showing transactions from {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Total Transactions</div>
          <div className="text-lg font-semibold">{filteredTransactions.length}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Total Profit</div>
          <div className="text-lg font-semibold text-green-600">{formatCurrency(totalProfit)}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Total Cost</div>
          <div className="text-lg font-semibold text-red-600">{formatCurrency(totalCost)}</div>
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 p-3 font-medium text-gray-700">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="grid grid-cols-12 p-3 border-t border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="col-span-2">{formatDate(transaction.date)}</div>
              <div className="col-span-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                  transaction.type === 'profit'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type === 'profit' ? 'Profit' : 'Cost'}
                </span>
              </div>
              <div className="col-span-6 truncate">{transaction.description}</div>
              <div className={`col-span-2 text-right font-semibold ${
                transaction.type === 'profit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-gray-50 rounded-md text-gray-500 text-center">
          No transactions match your filters.
        </div>
      )}
    </div>
  );
};

export default TransactionList;
