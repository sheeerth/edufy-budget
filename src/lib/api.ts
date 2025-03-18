import {
  Transaction,
  Stakeholder,
  Payment,
  DateRange,
  StakeholderShare,
} from '@/types';

// Funkcja pomocnicza do obsługi błędów API
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
};

// Funkcje dla transakcji
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await fetch('/api/transactions');
    const data = await handleApiError(response);

    // Konwertuj daty na obiekty Date
    return data.map((transaction: Omit<Transaction, 'date'> & { date: string }) => ({
      ...transaction,
      date: new Date(transaction.date)
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    const data = await handleApiError(response);
    return {
      ...data,
      date: new Date(data.date)
    };
  } catch (error) {
    console.error('Failed to add transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
  try {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    const data = await handleApiError(response);
    return {
      ...data,
      date: new Date(data.date)
    };
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });

    await handleApiError(response);
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
};

// Funkcje dla stakeholderów
export const getAllStakeholders = async (): Promise<Stakeholder[]> => {
  try {
    const response = await fetch('/api/stakeholders');
    return await handleApiError(response);
  } catch (error) {
    console.error('Failed to fetch stakeholders:', error);
    throw error;
  }
};

export const addStakeholder = async (stakeholder: Omit<Stakeholder, 'id'>): Promise<Stakeholder> => {
  try {
    const response = await fetch('/api/stakeholders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stakeholder),
    });

    return await handleApiError(response);
  } catch (error) {
    console.error('Failed to add stakeholder:', error);
    throw error;
  }
};

export const updateStakeholder = async (id: number, stakeholder: Partial<Stakeholder>): Promise<Stakeholder> => {
  try {
    const response = await fetch(`/api/stakeholders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stakeholder),
    });

    return await handleApiError(response);
  } catch (error) {
    console.error('Failed to update stakeholder:', error);
    throw error;
  }
};

export const deleteStakeholder = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`/api/stakeholders/${id}`, {
      method: 'DELETE',
    });

    await handleApiError(response);
  } catch (error) {
    console.error('Failed to delete stakeholder:', error);
    throw error;
  }
};

// Funkcje dla płatności
export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    const response = await fetch('/api/payments');
    const data = await handleApiError(response);

    // Konwertuj daty na obiekty Date
    return data.map((payment: Omit<Payment, 'date'> & { date: string }) => ({
      ...payment,
      date: new Date(payment.date)
    }));
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw error;
  }
};

export const recordPayment = async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
  try {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payment),
    });

    const data = await handleApiError(response);
    return {
      ...data,
      date: new Date(data.date)
    };
  } catch (error) {
    console.error('Failed to record payment:', error);
    throw error;
  }
};

export const deletePayment = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`/api/payments/${id}`, {
      method: 'DELETE',
    });

    await handleApiError(response);
  } catch (error) {
    console.error('Failed to delete payment:', error);
    throw error;
  }
};

// Typy dla obsługi danych w podsumowaniu finansowym
type PaymentWithStringDate = Omit<Payment, 'date'> & { date: string };

interface PaymentInfo {
  payments: PaymentWithStringDate[];
  [key: string]: unknown;
}

interface StakeholderPayment {
  [stakeholderId: string]: PaymentInfo;
}

interface MonthCalculation {
  stakeholderPayments: StakeholderPayment;
  month: string;
  profit: number;
  cost: number;
  balance: number;
  stakeholderShares: StakeholderShare;
  [key: string]: unknown;
}

interface StakeholderBalance {
  [stakeholderId: string]: {
    payments: PaymentWithStringDate[];
    [key: string]: unknown;
  };
}

interface ApiFinancialSummary {
  monthlyCalculations: MonthCalculation[];
  stakeholderBalances: StakeholderBalance;
  [key: string]: unknown;
}

// Funkcja do pobierania podsumowania finansowego
export const calculateFinancialSummary = async (
    transactions: Transaction[],
    dateRange: DateRange | null = null
): Promise<unknown> => {
  try {
    let url = '/api/summary';

    // Dodaj parametry filtrowania, jeśli podano zakres dat
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
    }

    const response = await fetch(url);
    const data = await handleApiError(response) as ApiFinancialSummary;

    // Konwertuj daty w miesięcznych obliczeniach
    return {
      stakeholderTotals: undefined,
      stakeholders: [],
      totalBalance: 0,
      totalCost: 0,
      totalProfit: 0,
      ...data,
      monthlyCalculations: data.monthlyCalculations.map((month) => ({
        ...month,
        month: month.month,
        profit: month.profit,
        cost: month.cost,
        balance: month.balance,
        stakeholderShares: month.stakeholderPayments,
        stakeholderPayments: Object.fromEntries(
            Object.entries(month.stakeholderPayments).map(([stakeholderId, paymentInfo]) => [
              stakeholderId,
              {
                ...paymentInfo,
                payments: paymentInfo.payments.map((payment) => ({
                  ...payment,
                  date: new Date(payment.date)
                }))
              }
            ])
        )
      })),
      stakeholderBalances: Object.fromEntries(
          Object.entries(data.stakeholderBalances).map(([stakeholderId, balance]) => [
            stakeholderId,
            {
              ...balance,
              payments: balance.payments.map((payment) => ({
                ...payment,
                date: new Date(payment.date)
              }))
            }
          ])
      )
    };
  } catch (error) {
    console.error('Failed to calculate financial summary:', error);
    throw error;
  }
};

// Inicjalizacja aplikacji (sprawdzenie połączenia z API)
export const initApp = async (): Promise<void> => {
  try {
    // Sprawdź czy API jest dostępne przez pobranie listy stakeholderów
    await getAllStakeholders();

    // Jeśli nie ma stakeholderów, dodaj domyślnych
    const stakeholders = await getAllStakeholders();

    if (stakeholders.length === 0) {
      await addStakeholder({ name: 'Stakeholder 1', active: true });
      await addStakeholder({ name: 'Stakeholder 2', active: true });
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    throw new Error('Could not connect to the API. Please check your server connection.');
  }
};

// Funkcja pomocnicza do zamknięcia aplikacji (placeholder)
export const closeApp = (): void => {
  // Nic nie musimy robić przy wyjściu z aplikacji w przypadku REST API
  console.log('Application resources released');
};
