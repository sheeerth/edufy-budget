import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Transaction,
  Stakeholder,
  Payment,
  FinancialSummary,
  DateRange
} from '../types';

// Define database schema
interface FinanceDB extends DBSchema {
  transactions: {
    key: number;
    value: Transaction & {
      date: number; // Stored as timestamp
      createdAt: number;
    };
    indexes: {
      'type': string;
      'date': number;
      'amount': number;
      'description': string;
    };
  };
  stakeholders: {
    key: number;
    value: Stakeholder;
    indexes: {
      'name': string;
    };
  };
  payments: {
    key: number;
    value: Payment & {
      date: number; // Stored as timestamp
      createdAt: number;
    };
    indexes: {
      'stakeholderId': number;
      'month': string;
      'date': number;
    };
  };
}

// Database constants
const DB_NAME = 'companyFinanceDB';
const DB_VERSION = 1;
const TRANSACTION_STORE = 'transactions';
const STAKEHOLDER_STORE = 'stakeholders';
const PAYMENT_STORE = 'payments';

// Get database instance
let dbPromise: Promise<IDBPDatabase<FinanceDB>> | null = null;

const getDB = async (): Promise<IDBPDatabase<FinanceDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<FinanceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create transaction store
        if (!db.objectStoreNames.contains(TRANSACTION_STORE)) {
          const transactionStore = db.createObjectStore(TRANSACTION_STORE, { keyPath: 'id', autoIncrement: true });
          transactionStore.createIndex('type', 'type', { unique: false });
          transactionStore.createIndex('date', 'date', { unique: false });
          transactionStore.createIndex('amount', 'amount', { unique: false });
          transactionStore.createIndex('description', 'description', { unique: false });
        }

        // Create stakeholder store
        if (!db.objectStoreNames.contains(STAKEHOLDER_STORE)) {
          const stakeholderStore = db.createObjectStore(STAKEHOLDER_STORE, { keyPath: 'id', autoIncrement: true });
          stakeholderStore.createIndex('name', 'name', { unique: true });

          // Add default stakeholders
          const defaultStakeholders: Stakeholder[] = [
            { id: 1, name: 'Stakeholder 1', active: true },
            { id: 2, name: 'Stakeholder 2', active: true }
          ];

          const tx = db.transaction(STAKEHOLDER_STORE, 'readwrite');
          const store = tx.objectStore(STAKEHOLDER_STORE);

          Promise.all(defaultStakeholders.map(stakeholder => store.add(stakeholder)))
            .catch(err => console.error('Error adding default stakeholders:', err));
        }

        // Create payment store
        if (!db.objectStoreNames.contains(PAYMENT_STORE)) {
          const paymentStore = db.createObjectStore(PAYMENT_STORE, { keyPath: 'id', autoIncrement: true });
          paymentStore.createIndex('stakeholderId', 'stakeholderId', { unique: false });
          paymentStore.createIndex('month', 'month', { unique: false });
          paymentStore.createIndex('date', 'date', { unique: false });
        }
      }
    });
  }

  return dbPromise;
};

// Initialize database
export const initDB = async (): Promise<void> => {
  await getDB();
};

// Add a transaction
export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<number> => {
  const db = await getDB();

  // Convert Date to timestamp for storage
  const txWithDate = {
    ...transaction,
    date: transaction.date.getTime(),
    createdAt: Date.now(),
  };

  return db.add(TRANSACTION_STORE, txWithDate as never);
};

// Get all transactions
export const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = await getDB();
  const transactions = await db.getAll(TRANSACTION_STORE);

  // Convert timestamps back to Date objects
  return transactions.map(tx => ({
    ...tx,
    date: new Date(tx.date),
  })).sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Add a stakeholder
export const addStakeholder = async (stakeholder: Stakeholder): Promise<number> => {
  const db = await getDB();
  return db.add(STAKEHOLDER_STORE, stakeholder);
};

// Get all stakeholders
export const getAllStakeholders = async (): Promise<Stakeholder[]> => {
  const db = await getDB();
  return db.getAll(STAKEHOLDER_STORE);
};

// Record a payment
export const recordPayment = async (payment: Omit<Payment, 'id'>): Promise<number> => {
  const db = await getDB();

  // Convert Date to timestamp for storage
  const paymentWithDate = {
    ...payment,
    date: payment.date.getTime(),
    createdAt: Date.now(),
  };

  return db.add(PAYMENT_STORE, paymentWithDate as never);
};

// Get all payments
export const getAllPayments = async (): Promise<Payment[]> => {
  const db = await getDB();
  const payments = await db.getAll(PAYMENT_STORE);

  // Convert timestamps back to Date objects
  return payments.map(payment => ({
    ...payment,
    date: new Date(payment.date),
  }));
};

// Calculate financial summary
export const calculateFinancialSummary = async (
  transactions: Transaction[],
  dateRange: DateRange | null = null
): Promise<FinancialSummary> => {
  // Get stakeholders
  const stakeholders = await getAllStakeholders();
  const activeStakeholders = stakeholders.filter(s => s.active);

  // Calculate split ratio based on number of stakeholders
  const splitRatio = 1 / activeStakeholders.length;

  // Get all payments
  const payments = await getAllPayments();

  // Filter transactions by date range if provided
  let filteredTransactions = transactions;
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day

    filteredTransactions = transactions.filter(transaction => {
      const txDate = transaction.date;
      return txDate >= startDate && txDate <= endDate;
    });
  }

  // Group transactions by month
  const monthlyTransactions: { [month: string]: Transaction[] } = {};

  filteredTransactions.forEach(transaction => {
    const date = transaction.date;
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyTransactions[monthKey]) {
      monthlyTransactions[monthKey] = [];
    }

    monthlyTransactions[monthKey].push(transaction);
  });

  // Calculate monthly balances and stakeholders' shares
  let totalProfit = 0;
  let totalCost = 0;

  // Initialize stakeholder totals
  const stakeholderTotals: { [stakeholderId: number]: number } = {};
  activeStakeholders.forEach(stakeholder => {
    stakeholderTotals[stakeholder.id] = 0;
  });

  const monthlyCalculations = Object.keys(monthlyTransactions).sort().map(monthKey => {
    const monthTransactions = monthlyTransactions[monthKey];

    // Calculate monthly profit and cost
    let monthlyProfit = 0;
    let monthlyCost = 0;

    monthTransactions.forEach(transaction => {
      if (transaction.type === 'profit') {
        monthlyProfit += transaction.amount;
        totalProfit += transaction.amount;
      } else if (transaction.type === 'cost') {
        monthlyCost += transaction.amount;
        totalCost += transaction.amount;
      }
    });

    // Calculate monthly balance
    const monthlyBalance = monthlyProfit - monthlyCost;

    // Calculate stakeholder shares for this month
    const stakeholderShares: { [stakeholderId: number]: number } = {};
    const stakeholderPayments: { [stakeholderId: number]: {
      totalPaid: number;
      remaining: number;
      payments: Payment[];
    }} = {};

    activeStakeholders.forEach(stakeholder => {
      // Calculate share (only if balance is positive)
      const share = monthlyBalance > 0 ? monthlyBalance * splitRatio : 0;
      stakeholderShares[stakeholder.id] = share;
      stakeholderTotals[stakeholder.id] += share;

      // Get payments for this stakeholder and month
      const monthPayments = payments.filter(p =>
        p.stakeholderId === stakeholder.id &&
        p.month === monthKey
      );

      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
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

  return {
    totalProfit,
    totalCost,
    totalBalance: totalProfit - totalCost,
    stakeholders: activeStakeholders,
    stakeholderTotals,
    monthlyCalculations,
  };
};
