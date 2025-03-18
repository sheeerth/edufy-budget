import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Typy dla parametrów
interface Params {
    params: Promise<{ id: string }>;
}

interface TransactionUpdateData {
    type?: string;
    amount?: number;
    date?: Date;
    description?: string;
}


// GET /api/transactions/[id]
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const processID = Number(id);

        if (isNaN(processID)) {
            return NextResponse.json(
                { error: 'Invalid ID format' },
                { status: 400 }
            );
        }

        const transaction = await prisma.transaction.findUnique({
            where: {
                id: processID
            }
        });

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transaction' },
            { status: 500 }
        );
    }
}

// DELETE /api/transactions/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const processID = Number(id);

        if (isNaN(processID)) {
            return NextResponse.json(
                { error: 'Invalid ID format' },
                { status: 400 }
            );
        }

        // Sprawdź, czy transakcja istnieje
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: processID
            }
        });

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        // Usuń transakcję
        await prisma.transaction.delete({
            where: {
                id: processID
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json(
            { error: 'Failed to delete transaction' },
            { status: 500 }
        );
    }
}

// PATCH /api/transactions/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const processID = Number(id);

        if (isNaN(processID)) {
            return NextResponse.json(
                { error: 'Invalid ID format' },
                { status: 400 }
            );
        }

        const data = await request.json();

        // Sprawdź, czy transakcja istnieje
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: processID
            }
        });

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        const { type, amount, date, description } = data;
        const updateData: TransactionUpdateData = {};

        if (type) updateData.type = type;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (date) updateData.date = new Date(date);
        if (description) updateData.description = description;

        // Aktualizuj transakcję
        const updatedTransaction = await prisma.transaction.update({
            where: {
                id: processID
            },
            data: updateData
        });

        return NextResponse.json(updatedTransaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to update transaction' },
            { status: 500 }
        );
    }
}
