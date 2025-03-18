import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const processID = Number(id);

        if (isNaN(processID)) {
            return NextResponse.json(
                { error: 'Invalid ID format' },
                { status: 400 }
            );
        }

        const payment = await prisma.payment.findUnique({
            where: {
                id: processID
            },
            include: {
                stakeholder: true
            }
        });

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error('Error fetching payment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payment' },
            { status: 500 }
        );
    }
}

// DELETE /api/payments/[id]
export async function DELETE(request: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const processID = Number(id);

        if (isNaN(processID)) {
            return NextResponse.json(
                { error: 'Invalid ID format' },
                { status: 400 }
            );
        }

        // Sprawdź, czy płatność istnieje
        const payment = await prisma.payment.findUnique({
            where: {
                id: processID
            }
        });

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // Usuń płatność
        await prisma.payment.delete({
            where: {
                id: processID
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment:', error);
        return NextResponse.json(
            { error: 'Failed to delete payment' },
            { status: 500 }
        );
    }
}

// PATCH /api/payments/[id]
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

        // Sprawdź, czy płatność istnieje
        const payment = await prisma.payment.findUnique({
            where: {
                id: processID
            }
        });

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // Jeśli zmieniamy stakeholdera, sprawdź czy nowy stakeholder istnieje
        if (data.stakeholderId && data.stakeholderId !== payment.stakeholderId) {
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
        }

        interface PaymentData {
            stakeholderId?: number;
            month?: string;
            amount?: string | number;
            date?: string | Date;
            notes?: string;
            isGlobalPayment?: boolean;
        }

        interface PaymentUpdateData {
            stakeholderId?: number;
            month?: string;
            amount?: number;
            date?: Date;
            notes?: string;
            isGlobalPayment?: boolean;
        }

        const processPaymentData = (data: PaymentData): PaymentUpdateData => {
            const {stakeholderId, month, amount, date, notes, isGlobalPayment} = data;

            const updateData: PaymentUpdateData = {};

            if (stakeholderId !== undefined) updateData.stakeholderId = stakeholderId;
            if (month !== undefined) updateData.month = month;
            if (amount !== undefined) updateData.amount = parseFloat(amount as string);
            if (date !== undefined) updateData.date = new Date(date);
            if (notes !== undefined) updateData.notes = notes;
            if (isGlobalPayment !== undefined) updateData.isGlobalPayment = isGlobalPayment;

            return updateData;
        };

        const updateData = processPaymentData(data);

        const updatedPayment = await prisma.payment.update({
            where: {
                id: processID
            },
            data: updateData
        });

        return NextResponse.json(updatedPayment);
    } catch (error) {
        console.error('Error updating payment:', error);
        return NextResponse.json(
            { error: 'Failed to update payment' },
            { status: 500 }
        );
    }
}
