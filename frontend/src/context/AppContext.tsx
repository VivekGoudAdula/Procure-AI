import React, { createContext, useContext, useState, useEffect } from 'react';
import { peraWallet } from '../lib/pera';

interface Transaction {
  id: string;
  supplier: string;
  amount: number;
  status: 'Pending' | 'Completed';
  txId?: string;
  date: string;
}

interface AppContextType {
  user: { email: string } | null;
  login: (email: string) => void;
  logout: () => void;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ email: string } | null>(() => {
    const saved = localStorage.getItem('procureai_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('procureai_txs');
    return saved ? JSON.parse(saved) : [
      { id: '1', supplier: 'Global Supply Co', amount: 1250, status: 'Completed', txId: 'TX_7823412', date: '2024-03-15' },
      { id: '2', supplier: 'TechLogistics Ltd', amount: 3400, status: 'Completed', txId: 'TX_9912304', date: '2024-03-18' },
    ];
  });

  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    return localStorage.getItem('walletAddress');
  });

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      // Setup the reconnect callback
      peraWallet.connector?.on("disconnect", () => {
        setWalletAddress(null);
        localStorage.removeItem('walletAddress');
      });

      if (accounts.length) {
        setWalletAddress(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('procureai_txs', JSON.stringify(transactions));
  }, [transactions]);

  const login = (email: string) => {
    const newUser = { email };
    setUser(newUser);
    localStorage.setItem('procureai_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('procureai_user');
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  };

  return (
    <AppContext.Provider value={{ user, login, logout, transactions, addTransaction, walletAddress, setWalletAddress }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
