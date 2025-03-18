import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {Payment} from "@/types";

// GET /api/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(request: NextRequest) {
    try {
        // Pobierz parametry filtrowania
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Przygotuj filtry dat, jeśli podano
        let dateFilter = {};
        if (startDateParam && endDateParam) {
            const startDate = new Date(startDateParam);
            const endDate = new Date(endDateParam);
            endDate.setHours(23, 59, 59, 999); // Ustaw na koniec dnia

            dateFilter = {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            };
        }

        // Pobierz wszystkie transakcje z filtrowaniem dat
        const transactions = await prisma.transaction.findMany({
            where: dateFilter,
            orderBy: {
                date: 'desc'
            }
        });

        // Pobierz aktywnych stakeholderów
        const stakeholders = await prisma.stakeholder.findMany({
            where: {
                active: true
            }
        });

        // Pobierz wszystkie płatności
        const payments = await prisma.payment.findMany({
            include: {
                stakeholder: true
            }
        });

        // Oblicz współczynnik podziału na podstawie liczby stakeholderów
        const splitRatio = 1 / stakeholders.length;

        // Grupuj transakcje według miesiąca
        const monthlyTransactions: Record<string, { date: string; type: string; amount: number }[]> = {};

        transactions.forEach((transaction) => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (!monthlyTransactions[monthKey]) {
                monthlyTransactions[monthKey] = [];
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            monthlyTransactions[monthKey].push(transaction);
        });

        // Przygotuj obiekty do obliczeń
        let totalProfit = 0;
        let totalCost = 0;

        // Inicjalizuj salda stakeholderów
        const stakeholderTotals: Record<number, number> = {};
        const stakeholderBalances: Record<number, {
            totalShare: number;
            totalPaid: number;
            remaining: number;
            payments: Payment[];
        }> = {};

        stakeholders.forEach((stakeholder: { id: number }) => {
            stakeholderTotals[stakeholder.id] = 0;

            // Pobierz globalne płatności dla tego stakeholdera
            const globalPayments = payments.filter((p) =>
                p.stakeholderId === stakeholder.id &&
                (p.isGlobalPayment || p.month === null)
            );

            stakeholderBalances[stakeholder.id] = {
                totalShare: 0,
                totalPaid: globalPayments.reduce((sum: number , p: { amount: number }) => sum + p.amount, 0),
                remaining: 0,
                payments: globalPayments
            };
        });

        // Oblicz miesięczne sumy i udziały stakeholderów
        const monthlyCalculations = Object.keys(monthlyTransactions).sort().map((monthKey) => {
            const monthTransactions = monthlyTransactions[monthKey];

            // Oblicz miesięczny zysk i koszt
            let monthlyProfit = 0;
            let monthlyCost = 0;

            monthTransactions.forEach((transaction) => {
                if (transaction.type === 'profit') {
                    monthlyProfit += transaction.amount;
                    totalProfit += transaction.amount;
                } else if (transaction.type === 'cost') {
                    monthlyCost += transaction.amount;
                    totalCost += transaction.amount;
                }
            });

            // Oblicz miesięczny bilans
            const monthlyBalance = monthlyProfit - monthlyCost;

            // Oblicz udziały stakeholderów dla tego miesiąca
            const stakeholderShares: Record<number, number> = {};
            const stakeholderPayments: Record<number, {
                totalPaid: number;
                remaining: number;
                payments: Payment[];
            }> = {};

            stakeholders.forEach((stakeholder: { id: number}) => {
                // Oblicz udział (tylko jeśli bilans jest dodatni)
                const share = monthlyBalance > 0 ? monthlyBalance * splitRatio : 0;
                stakeholderShares[stakeholder.id] = share;
                stakeholderTotals[stakeholder.id] += share;
                stakeholderBalances[stakeholder.id].totalShare += share;

                // Pobierz płatności dla tego stakeholdera i miesiąca
                const monthPayments = payments.filter((p) =>
                    p.stakeholderId === stakeholder.id &&
                    p.month === monthKey &&
                    !p.isGlobalPayment
                );

                const totalPaid = monthPayments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
                stakeholderPayments[stakeholder.id] = {
                    totalPaid,
                    remaining: share - totalPaid,
                    payments: monthPayments
                };
            });

            return {
                month: monthKey,
                profit: monthlyProfit,
                cost: monthlyCost,
                balance: monthlyBalance,
                stakeholderShares,
                stakeholderPayments
            };
        });

        // Oblicz pozostały bilans dla każdego stakeholdera
        stakeholders.forEach((stakeholder: { id: number }) => {
            const balance = stakeholderBalances[stakeholder.id];
            balance.remaining = balance.totalShare - balance.totalPaid;
        });

        // Skonstruuj obiekt podsumowania
        const summary = {
            totalProfit,
            totalCost,
            totalBalance: totalProfit - totalCost,
            stakeholders,
            stakeholderTotals,
            stakeholderBalances,
            monthlyCalculations
        };

        return NextResponse.json(summary);
    } catch (error) {
        console.error('Error generating summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate financial summary' },
            { status: 500 }
        );
    }
}
