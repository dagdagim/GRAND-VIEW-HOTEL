import React, { createContext, useContext, useState } from 'react';

export type CurrencyCode = 'ETB' | 'USD';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatPrice: (amountInETB: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Approximate exchange rate for display
const USD_RATE = 128; // 1 USD = 128 ETB

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyCode>('ETB');

  const formatPrice = (amountInETB: number): string => {
    if (currency === 'USD') {
      const usd = Math.round(amountInETB / USD_RATE);
      return `$${usd.toLocaleString()}`;
    }
    return `ETB ${Math.round(amountInETB).toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
