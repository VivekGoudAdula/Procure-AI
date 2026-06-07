import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { peraWallet } from '../lib/pera';
import { API_BASE_URL } from '../config';

// Global Axios Request Interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('procureai_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global Fetch Interceptor / Patch
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('procureai_token');
  if (token) {
    const url = typeof input === 'string' 
      ? input 
      : (input instanceof URL 
          ? input.href 
          : (input && typeof input === 'object' && 'url' in input 
              ? (input as any).url 
              : ''));

    // Only inject Bearer token for relative or local API requests
    const isApiRequest = 
      url.startsWith('/') || 
      url.startsWith(window.location.origin) || 
      (typeof API_BASE_URL === 'string' && url.startsWith(API_BASE_URL));

    if (isApiRequest) {
      init = init || {};
      init.headers = init.headers || {};
      if (init.headers instanceof Headers) {
        init.headers.set('Authorization', `Bearer ${token}`);
      } else if (Array.isArray(init.headers)) {
        const authHeaderIndex = init.headers.findIndex(([k]) => k.toLowerCase() === 'authorization');
        if (authHeaderIndex !== -1) {
          init.headers[authHeaderIndex] = ['Authorization', `Bearer ${token}`];
        } else {
          init.headers.push(['Authorization', `Bearer ${token}`]);
        }
      } else {
        (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
  }
  return originalFetch(input, init);
};

interface Transaction {
  id: string;
  supplier: string;
  amount: number;
  status: 'Pending' | 'Completed';
  txId?: string;
  date: string;
}

interface AppContextType {
  user: { email: string; name?: string; role?: string } | null;
  login: (email: string, token: string, role?: string) => void;
  logout: () => void;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(() => {
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

  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem('walletAddress', walletAddress);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [walletAddress]);

  const login = (email: string, token: string, role?: string) => {
    const name = email.split('@')[0].split(/[._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    const newUser = { email, name, role };
    setUser(newUser);
    localStorage.setItem('procureai_user', JSON.stringify(newUser));
    localStorage.setItem('procureai_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('procureai_user');
    localStorage.removeItem('procureai_token');
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
