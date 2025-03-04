// Format currency
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date
  export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format month
  export const formatMonth = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };
  
  // Convert date to YYYY-MM-DD format
  export const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Get current date in YYYY-MM-DD format
  export const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };
  
  // Generate month key (YYYY-M) from date
  export const getMonthKey = (date: Date): string => {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  };