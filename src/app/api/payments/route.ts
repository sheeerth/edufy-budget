import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/payments
export async function GET() {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                stakeholder: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payments' },
            { status: 500 }
        );
    }
}

// POST /api/payments
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Walidacja danych
        if (!data.stakeholderId || !data.amount || !data.date) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Sprawdź, czy stakeholder istnieje
        const stakeholder = await prisma.stakeholder.findUnique({
            where: {
                id: data.stakeholderId
            }
        });

        if (!stakeholder) {
            return NextResponse.json(
                { error: 'Stakeholder not found' },
                { status: 404 }
            );
        }

        const payment = await prisma.payment.create({
            data: {
                stakeholderId: data.stakeholderId,
                month: data.month || null,
                amount: parseFloat(data.amount),
                date: new Date(data.date),
                notes: data.notes || '',
                isGlobalPayment: data.isGlobalPayment || false
            }
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error('Error creating payment:', error);
        return NextResponse.json(
            { error: 'Failed to create payment' },
            { status: 500 }
        );
    }
}
