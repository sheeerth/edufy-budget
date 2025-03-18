import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/transactions
export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Walidacja danych
        if (!data.type || !data.amount || !data.date || !data.description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Konwersja daty z ISO string na obiekt Date
        const transaction = await prisma.transaction.create({
            data: {
                type: data.type,
                amount: parseFloat(data.amount),
                date: new Date(data.date),
                description: data.description
            }
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        );
    }
}
