import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Sprawdź, czy mamy już jakichś stakeholderów
    const stakeholderCount = await prisma.stakeholder.count();

    if (stakeholderCount === 0) {
        console.log('Dodawanie domyślnych stakeholderów...');

        // Dodaj domyślnych stakeholderów
        await prisma.stakeholder.createMany({
            data: [
                { name: 'Stakeholder 1', active: true },
                { name: 'Stakeholder 2', active: true }
            ]
        });

        console.log('Domyślni stakeholderzy zostali dodani!');
    } else {
        console.log(`Znaleziono ${stakeholderCount} istniejących stakeholderów. Pomijam dodawanie domyślnych.`);
    }

    // Dodaj przykładowe transakcje, jeśli nie ma żadnych
    const transactionCount = await prisma.transaction.count();

    if (transactionCount === 0) {
        console.log('Dodawanie przykładowych transakcji...');

        // Oblicz daty dla ostatnich kilku miesięcy
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
        const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 10);

        // Dodaj przykładowe transakcje
        await prisma.transaction.createMany({
            data: [
                {
                    type: 'profit',
                    amount: 5000,
                    date: lastMonth,
                    description: 'Przychód z projektu klienta A'
                },
                {
                    type: 'cost',
                    amount: 1200,
                    date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 5),
                    description: 'Czynsz za biuro'
                },
                {
                    type: 'profit',
                    amount: 3500,
                    date: twoMonthsAgo,
                    description: 'Usługi konsultingowe'
                },
                {
                    type: 'cost',
                    amount: 800,
                    date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), twoMonthsAgo.getDate() + 5),
                    description: 'Subskrypcje oprogramowania'
                }
            ]
        });

        console.log('Przykładowe transakcje zostały dodane!');
    } else {
        console.log(`Znaleziono ${transactionCount} istniejących transakcji. Pomijam dodawanie przykładowych.`);
    }
}

main()
    .catch((e) => {
        console.error('Błąd podczas seedowania bazy danych:', e);
        process.exit(1);
    })
    .finally(async () => {
        // Zamknij połączenie Prisma po zakończeniu
        await prisma.$disconnect();
    });
