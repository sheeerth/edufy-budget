import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/stakeholders
export async function GET() {
    try {
        const stakeholders = await prisma.stakeholder.findMany();
        return NextResponse.json(stakeholders);
    } catch (error) {
        console.error('Error fetching stakeholders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stakeholders' },
            { status: 500 }
        );
    }
}

// POST /api/stakeholders
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Walidacja danych
        if (!data.name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Sprawdź, czy stakeholder o takiej nazwie już istnieje
        const existingStakeholder = await prisma.stakeholder.findUnique({
            where: {
                name: data.name
            }
        });

        if (existingStakeholder) {
            return NextResponse.json(
                { error: 'Stakeholder with this name already exists' },
                { status: 409 }
            );
        }

        const stakeholder = await prisma.stakeholder.create({
            data: {
                name: data.name,
                active: data.active !== undefined ? data.active : true
            }
        });

        return NextResponse.json(stakeholder, { status: 201 });
    } catch (error) {
        console.error('Error creating stakeholder:', error);
        return NextResponse.json(
            { error: 'Failed to create stakeholder' },
            { status: 500 }
        );
    }
}
