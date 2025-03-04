'use client';

import React, { useState, useEffect } from 'react';
import { 
  Transaction, 
  Stakeholder, 
  Payment, 
  DateRange, 
  FinancialSummary as FinancialSummaryType 
} from '../types';
import { formatCurrency, formatMonth } from '../lib/utils';
import { calculateFinancialSummary, recordPayment } from '../lib/db';
import PaymentModal from './PaymentModal';

interface FinancialSummaryProps {
  transactions: Transaction[];
  refreshTrigger: number;
  stakeholders: Stakeholder[];
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ 
  transactions, 
  refreshTrigger,
  stakeholders
}) => {
  const [showMonthlyDetails, setShowMonthlyDetails] = useState<boolean>(false);
  const [summary, setSummary] = useState<FinancialSummaryType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  
  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedShareAmount, setSelectedShareAmount] = useState<number>(0);
  const [selectedPaidAmount, setSelectedPaidAmount] = useState<number>(0);
  
  // Load summary data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Calculate financial summary
        const calculatedSummary = await calculateFinancialSummary(
          transactions,
          dateRange.startDate && dateRange.endDate ? dateRange : null
        );
        
        setSummary(calculatedSummary);
      } catch (error) {
        console.error('Failed to calculate summary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [transactions, dateRange, refreshTrigger]);
  
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
  
  const openPaymentModal = (stakeholderId: number, month: string) => {
    if (!summary) return;
    
    const monthData = summary.monthlyCalculations.find(m => m.month === month);
    if (!monthData) return;
    
    const shareAmount = monthData.stakeholderShares[stakeholderId] || 0;
    const paidAmount = monthData.stakeholderPayments[stakeholderId]?.totalPaid || 0;
    
    setSelectedStakeholder(stakeholderId);
    setSelectedMonth(month);
    setSelectedShareAmount(shareAmount);
    setSelectedPaidAmount(paidAmount);
    setIsPaymentModalOpen(true);
  };
  
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedStakeholder(null);
    setSelectedMonth(null);
  };
  
  const handleRecordPayment = async (payment: Omit<Payment, 'id'>) => {
    try {
      await recordPayment(payment);
      
      // Recalculate summary
      const recalculatedSummary = await calculateFinancialSummary(
        transactions,
        dateRange.startDate && dateRange.endDate ? dateRange : null
      );
      
      setSummary(recalculatedSummary);
    } catch (error) {
      console.error('Failed to record payment:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
        <div className="p-6 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          Loading financial data...
        </div>
      </div>
    );
  }
  
  if (!summary || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
        <div className="p-6 bg-gray-50 rounded-md text-gray-500 text-center">
          No financial data available yet.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
      
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-md mb-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateFilterChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                id="endDate"
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
              Clear Filter
            </button>
          </div>
        </div>
        
        {dateRange.startDate && dateRange.endDate && (
          <div className="p-2 bg-blue-50 text-blue-700 rounded-md text-sm">
            Showing data from {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Total Profit</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(summary.totalProfit)}</div>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Total Cost</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(summary.totalCost)}</div>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Net Balance</div>
          <div className={`text-xl font-bold ${summary.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.totalBalance)}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Stakeholder Shares</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.stakeholders.map(stakeholder => (
            <div 
              key={stakeholder.id} 
              className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500"
            >
              <div className="text-lg font-medium text-gray-800">{stakeholder.name}</div>
              <div className="text-xl font-bold text-blue-700">
                {formatCurrency(summary.stakeholderTotals[stakeholder.id])}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <button
          onClick={() => setShowMonthlyDetails(!showMonthlyDetails)}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {showMonthlyDetails ? 'Hide Monthly Details' : 'Show Monthly Details'}
        </button>
      </div>
      
      {showMonthlyDetails && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Monthly Breakdown</h3>
          
          {summary.monthlyCalculations.map((month) => (
            <div key={month.month} className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 p-4">
                <h4 className="text-lg font-medium text-gray-800">{formatMonth(month.month)}</h4>
                
                <div className="flex flex-wrap gap-6 mt-2">
                  <div>
                    <span className="text-gray-600">Profit:</span>{' '}
                    <span className="font-medium text-green-600">{formatCurrency(month.profit)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cost:</span>{' '}
                    <span className="font-medium text-red-600">{formatCurrency(month.cost)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Balance:</span>{' '}
                    <span className={`font-medium ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(month.balance)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stakeholder
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Share
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.stakeholders.map(stakeholder => {
                      const share = month.stakeholderShares[stakeholder.id] || 0;
                      const paid = month.stakeholderPayments[stakeholder.id]?.totalPaid || 0;
                      const remaining = share - paid;
                      
                      return (
                        <tr key={stakeholder.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stakeholder.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(share)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(paid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <button
                              onClick={() => openPaymentModal(stakeholder.id, month.month)}
                              disabled={remaining <= 0}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Record Payment
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        onSubmit={handleRecordPayment}
        stakeholderId={selectedStakeholder}
        month={selectedMonth}
        stakeholders={stakeholders}
        shareAmount={selectedShareAmount}
        paidAmount={selectedPaidAmount}
      />
    </div>
  );
};

export default FinancialSummary;