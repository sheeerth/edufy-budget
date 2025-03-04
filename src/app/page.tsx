'use client';

import React, { useState, useEffect } from 'react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import FinancialSummary from '../components/FinancialSummary';
import { initDB, getAllTransactions, addTransaction, getAllStakeholders } from '../lib/db';
import { Transaction, Stakeholder } from '../types';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Initialize the database and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        await loadTransactions();
        await loadStakeholders();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError('Failed to initialize the database. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  const loadTransactions = async () => {
    try {
      const allTransactions = await getAllTransactions();
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setError('Failed to load transactions. Please try again.');
    }
  };
  
  const loadStakeholders = async () => {
    try {
      const allStakeholders = await getAllStakeholders();
      setStakeholders(allStakeholders);
    } catch (error) {
      console.error('Failed to load stakeholders:', error);
      setError('Failed to load stakeholders. Please try again.');
    }
  };
  
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      await addTransaction(transaction);
      await loadTransactions();
      // Trigger refresh of financial summary
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };
  
  const refreshData = () => {
    loadTransactions();
    setRefreshTrigger(prev => prev + 1);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200 max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <TransactionForm onAddTransaction={handleAddTransaction} />
      </div>
      
      <div className="lg:col-span-3 space-y-6">
        <FinancialSummary 
          transactions={transactions} 
          refreshTrigger={refreshTrigger}
          stakeholders={stakeholders} 
        />
        
        <TransactionList 
          transactions={transactions} 
          onRefresh={refreshData} 
        />
      </div>
    </div>
  );
}