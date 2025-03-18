'use client';

import React, { useState } from 'react';
import { Stakeholder, Payment, StakeholderBalance } from '../types';
import { formatCurrency } from '../lib/utils';

interface GlobalPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payment: Omit<Payment, 'id'>) => Promise<void>;
    stakeholderId: number | null;
    stakeholders: Stakeholder[];
    stakeholderBalance: StakeholderBalance | null;
}

const GlobalPaymentModal: React.FC<GlobalPaymentModalProps> = ({
                                                                   isOpen,
                                                                   onClose,
                                                                   onSubmit,
                                                                   stakeholderId,
                                                                   stakeholders,
                                                                   stakeholderBalance,
                                                               }) => {
    const [amount, setAmount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    if (!isOpen || !stakeholderId || !stakeholderBalance) {
        return null;
    }

    const stakeholder = stakeholders.find(s => s.id === stakeholderId);
    const { totalShare, totalPaid, remaining } = stakeholderBalance;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Clear previous error
        if (error) {
            setError('');
        }

        setAmount(value);
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    const handleSubmit = async () => {
        // Validate amount
        if (!amount || isNaN(parseFloat(amount))) {
            setError('Proszę wprowadzić prawidłową kwotę');
            return;
        }

        const amountValue = parseFloat(amount);

        if (amountValue <= 0) {
            setError('Kwota musi być większa od zera');
            return;
        }

        // Check if amount exceeds remaining balance and show confirmation if it does
        if (amountValue > remaining) {
            const isConfirmed = window.confirm(
                `Uwaga: Wprowadzona kwota ${formatCurrency(amountValue)} przekracza dostępne saldo stakeholdera ${formatCurrency(remaining)}. ` +
                `Stakeholder będzie miał ujemny bilans ${formatCurrency(remaining - amountValue)}. Czy na pewno chcesz kontynuować?`
            );

            if (!isConfirmed) {
                return;
            }
        }

        setIsSubmitting(true);

        try {
            await onSubmit({
                stakeholderId,
                amount: amountValue,
                date: new Date(),
                notes: notes || `Wypłata ogólna dla ${stakeholder?.name}`,
                isGlobalPayment: true
            });

            // Reset form and close modal
            setAmount('');
            setNotes('');
            onClose();
        } catch (error) {
            console.error('Nie udało się zarejestrować płatności:', error);
            setError('Nie udało się zarejestrować płatności. Spróbuj ponownie.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Rejestruj wypłatę dla {stakeholder?.name}</h3>
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
                            <div className="text-gray-600">Całkowity udział:</div>
                            <div className="font-medium">{formatCurrency(totalShare)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="text-gray-600">Już wypłacono:</div>
                            <div className="font-medium">{formatCurrency(totalPaid)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                            <div className="text-gray-600 font-semibold">Pozostało do wypłaty:</div>
                            <div className={`font-semibold ${remaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(remaining)}
                            </div>
                        </div>

                        {remaining < 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                <strong>Uwaga:</strong> Ten stakeholder ma już ujemny bilans. Wypłaty będą zwiększać ujemne saldo.
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                            Kwota wypłaty:
                        </label>
                        <input
                            type="number"
                            id="paymentAmount"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Wprowadź kwotę"
                            step="0.01"
                            min="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">
                            Notatki (opcjonalne):
                        </label>
                        <textarea
                            id="paymentNotes"
                            value={notes}
                            onChange={handleNotesChange}
                            placeholder="Dodaj notatkę dotyczącą tej wypłaty"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Rejestrowanie...' : 'Zarejestruj wypłatę'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalPaymentModal;
