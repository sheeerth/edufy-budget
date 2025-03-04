'use client';

import React, { useState } from 'react';
import { Stakeholder, Payment } from '../types';
import { formatCurrency, formatMonth } from '../lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: Omit<Payment, 'id'>) => Promise<void>;
  stakeholderId: number | null;
  month: string | null;
  stakeholders: Stakeholder[];
  shareAmount: number;
  paidAmount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stakeholderId,
  month,
  stakeholders,
  shareAmount,
  paidAmount,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || !stakeholderId || !month) {
    return null;
  }

  const stakeholder = stakeholders.find(s => s.id === stakeholderId);
  const remainingAmount = shareAmount - paidAmount;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Clear previous error
    if (error) {
      setError('');
    }

    setAmount(value);
  };

  const handleSubmit = async () => {
    // Validate amount
    if (!amount || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);

    if (amountValue <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (amountValue > remainingAmount) {
      setError(`Amount cannot exceed the remaining balance of ${formatCurrency(remainingAmount)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        stakeholderId,
        month,
        amount: amountValue,
        date: new Date(),
        notes: `Payment for ${formatMonth(month)}`
      });

      // Reset form and close modal
      setAmount('');
      onClose();
    } catch (error) {
      console.error('Failed to record payment:', error);
      setError('Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-semibold">Record Payment</h3>
          <button
            onClick={onClose}
            className="text-white text-xl hover:text-blue-200 transition-colors focus:outline-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-gray-600">Stakeholder:</div>
              <div className="font-medium">{stakeholder?.name}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-gray-600">Month:</div>
              <div className="font-medium">{formatMonth(month)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-gray-600">Total Share:</div>
              <div className="font-medium">{formatCurrency(shareAmount)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-gray-600">Already Paid:</div>
              <div className="font-medium">{formatCurrency(paidAmount)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              <div className="text-gray-600 font-semibold">Remaining:</div>
              <div className="font-semibold text-blue-600">{formatCurrency(remainingAmount)}</div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount:
            </label>
            <input
              type="number"
              id="paymentAmount"
              value={amount}
              onChange={handleAmountChange}
              placeholder={`Enter amount (max: ${formatCurrency(remainingAmount)})`}
              step="0.01"
              min="0.01"
              max={remainingAmount}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
