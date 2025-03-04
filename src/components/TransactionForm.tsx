'use client';

import React, { useState } from 'react';
import { Transaction, TransactionFormData } from '../types';
import { getCurrentDate } from '../lib/utils';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'profit',
    amount: '',
    date: getCurrentDate(),
    description: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
    
    // Clear error when field is changed
    if (errors[name as keyof TransactionFormData]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TransactionFormData, string>> = {};
    
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    
    if (!formData.amount || parseFloat(String(formData.amount)) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!String(formData.description).trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);
      
      try {
        await onAddTransaction({
          type: formData.type,
          amount: parseFloat(String(formData.amount)),
          date: new Date(formData.date),
          description: String(formData.description),
        });
        
        // Reset form data
        setFormData({
          type: 'profit',
          amount: '',
          date: getCurrentDate(),
          description: '',
        });
      } catch (error) {
        console.error('Failed to add transaction:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
          <div className="flex space-x-4">
            <label className={`flex items-center px-4 py-2 rounded-md cursor-pointer border transition-colors ${
              formData.type === 'profit' 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="type"
                value="profit"
                checked={formData.type === 'profit'}
                onChange={handleChange}
                className="mr-2"
              />
              Profit
            </label>
            
            <label className={`flex items-center px-4 py-2 rounded-md cursor-pointer border transition-colors ${
              formData.type === 'cost' 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="type"
                value="cost"
                checked={formData.type === 'cost'}
                onChange={handleChange}
                className="mr-2"
              />
              Cost
            </label>
          </div>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
        </div>
        
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>
        
        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;