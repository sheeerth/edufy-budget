'use client';

import React, { useState } from 'react';
import { Payment, Stakeholder } from '../types';
import { formatCurrency, formatDate, formatMonth } from '../lib/utils';

interface PaymentHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    stakeholder: Stakeholder | null;
    payments: Payment[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
                                                           isOpen,
                                                           onClose,
                                                           stakeholder,
                                                           payments,
                                                       }) => {
    const [filter, setFilter] = useState<'all' | 'global' | 'monthly'>('all');

    if (!isOpen || !stakeholder) {
        return null;
    }

    const filteredPayments = payments.filter(payment => {
        if (filter === 'all') return true;
        if (filter === 'global') return payment.isGlobalPayment === true || payment.month === undefined;
        if (filter === 'monthly') return payment.month !== undefined && payment.isGlobalPayment !== true;
        return true;
    });

    const sortedPayments = [...filteredPayments].sort((a, b) =>
        b.date.getTime() - a.date.getTime()
    );

    const totalAmount = sortedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Historia wypłat - {stakeholder.name}</h3>
                    <button
                        onClick={onClose}
                        className="text-white text-xl hover:text-blue-200 transition-colors focus:outline-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-3 py-1 rounded ${
                                    filter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                Wszystkie
                            </button>
                            <button
                                onClick={() => setFilter('global')}
                                className={`px-3 py-1 rounded ${
                                    filter === 'global'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                Wypłaty ogólne
                            </button>
                            <button
                                onClick={() => setFilter('monthly')}
                                className={`px-3 py-1 rounded ${
                                    filter === 'monthly'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                Wypłaty miesięczne
                            </button>
                        </div>

                        <div className="text-right">
                            <div className="text-sm text-gray-500">Suma wypłat:</div>
                            <div className="text-lg font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
                        </div>
                    </div>

                    {sortedPayments.length > 0 ? (
                        <div className="border border-gray-200 rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Typ
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Opis
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kwota
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {sortedPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(payment.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.isGlobalPayment || !payment.month ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Ogólna
                          </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {formatMonth(payment.month)}
                          </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {payment.notes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-6 text-center text-gray-500 rounded-md">
                            Brak płatności dla wybranego filtru.
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                        Zamknij
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistory;
