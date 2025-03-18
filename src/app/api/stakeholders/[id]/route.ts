import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Typy dla parametrów
interface Params {
    params: Promise<{ id: string }>;
}

interface StakeholderUpdateInput {
    name?: string;
    active?: boolean;
}

// Interfejs dla danych wyjściowych
interface StakeholderUpdateData {
    name?: string;
    active?: boolean;
}


// GET /api/stakeholders/[id]
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

        const stakeholder = await prisma.stakeholder.findUnique({
            where: {
                id: processID
            },
            include: {
                payments: true
            }
        });

        if (!stakeholder) {
            return NextResponse.json(
                { error: 'Stakeholder not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(stakeholder);
    } catch (error) {
        console.error('Error fetching stakeholder:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stakeholder' },
            { status: 500 }
        );
    }
}

// PATCH /api/stakeholders/[id]
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

        // Sprawdź, czy stakeholder istnieje
        const stakeholder = await prisma.stakeholder.findUnique({
            where: {
                id: processID
            }
        });

        if (!stakeholder) {
            return NextResponse.json(
                { error: 'Stakeholder not found' },
                { status: 404 }
            );
        }

        // Jeśli zmieniamy nazwę, sprawdź czy nowa nazwa jest unikalna
        if (data.name && data.name !== stakeholder.name) {
            const existingWithName = await prisma.stakeholder.findUnique({
                where: {
                    name: data.name
                }
            });

            if (existingWithName) {
                return NextResponse.json(
                    { error: 'Stakeholder with this name already exists' },
                    { status: 409 }
                );
            }
        }

        // Przygotuj dane do aktualizacji
        const updateData = prepareStakeholderUpdateData(data);

        // Aktualizuj stakeholdera
        const updatedStakeholder = await prisma.stakeholder.update({
            where: {
                id: processID
            },
            data: updateData
        });

        return NextResponse.json(updatedStakeholder);
    } catch (error) {
        console.error('Error updating stakeholder:', error);
        return NextResponse.json(
            { error: 'Failed to update stakeholder' },
            { status: 500 }
        );
    }
}

function prepareStakeholderUpdateData(data: StakeholderUpdateInput): StakeholderUpdateData {
    const updateData: StakeholderUpdateData = {};

    if (data.name) updateData.name = data.name;
    if (data.active !== undefined) updateData.active = data.active;

    return updateData;
}


// DELETE /api/stakeholders/[id]
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

        // Sprawdź, czy stakeholder istnieje
        const stakeholder = await prisma.stakeholder.findUnique({
            where: {
                id: processID
            },
            include: {
                payments: {
                    take: 1 // Pobierz tylko jedną płatność, aby sprawdzić czy istnieją
                }
            }
        });

        if (!stakeholder) {
            return NextResponse.json(
                { error: 'Stakeholder not found' },
                { status: 404 }
            );
        }

        // Sprawdź, czy stakeholder ma płatności
        if (stakeholder.payments.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete stakeholder with payments. Deactivate instead.' },
                { status: 400 }
            );
        }

        // Usuń stakeholdera
        await prisma.stakeholder.delete({
            where: {
                id: processID
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting stakeholder:', error);
        return NextResponse.json(
            { error: 'Failed to delete stakeholder' },
            { status: 500 }
        );
    }
}
