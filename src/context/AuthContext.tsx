import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

interface Transaction {
  _id?: string;
  type: string;
  amount: number;
  receipt_id?: string;
  store_name?: string;
  description?: string;
  created_at: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  avatar?: string;
  picture?: string;
  cardNumber?: string;
}

interface AuthContextType {
  user: User | null;
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const isRefreshing = useRef(false);
  const hasInitialData = useRef(false);
  const isConsuming = useRef(false);

  const SHOXPAY_BACKEND = import.meta.env.VITE_BACKEND_URL;

  const refreshData = useCallback(async () => {
    console.log('🔄 [ShoxGame Auth] refreshData boshlandi...');
    if (isRefreshing.current) {
      console.log('⏳ [ShoxGame Auth] refreshData allaqachon ishlamoqda, to\'xtatildi');
      return;
    }
    
    const token = sessionStorage.getItem('access_token');
    // Token bo'lmasa ham davom etaveramiz, chunki Cookie bo'lishi mumkin
    
    try {
      isRefreshing.current = true;
      console.log('📡 [ShoxGame Auth] Wallet ma\'lumotlari so\'ralmoqda...');
      const res = await fetch(`${SHOXPAY_BACKEND}/api/cashback/wallet`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await res.json();
      console.log('📦 [ShoxGame Auth] Wallet ma\'lumotlari keldi:', data.success);

      if (data.success) {
        setBalance(data.balance ?? 0);
        setTransactions(data.transactions ?? []);
        
        if (data.cardNumber) {
          setUser(prev => {
            if (!prev) return null;
            if (prev.cardNumber === data.cardNumber) return prev;
            const updated = { ...prev, cardNumber: data.cardNumber };
            sessionStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (e) {
      console.error('❌ [ShoxGame Auth] refreshData xatosi:', e);
    } finally {
      isRefreshing.current = false;
      setLoading(false);
      console.log('✅ [ShoxGame Auth] refreshData yakunlandi, loading: false');
    }
  }, []);

  useEffect(() => {
    if (socket) return;
    
    const newSocket = io(SHOXPAY_BACKEND, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      timeout: 10000
    });
    setSocket(newSocket);

    newSocket.on('balance-updated', ({ balance: newBalance }) => {
      setBalance(newBalance);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (socket && user) {
      socket.emit('join-user', user._id);
    }
  }, [socket, user?._id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUser = params.get('user');
    const storedUser = sessionStorage.getItem('user');

    // 1. Agar URL da ma'lumot kelsa (Eski usul yoki o'tish) - darhol tozalaymiz
    if (urlToken && urlUser) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(urlUser));
        sessionStorage.setItem('access_token', urlToken);
        sessionStorage.setItem('user', JSON.stringify(decodedUser));
        setUser(decodedUser);
        window.history.replaceState({}, document.title, window.location.pathname);
        refreshData();
        return;
      } catch (e) {
        console.error('URL Data Error', e);
      }
    }

    // 2. Agar sessionStorage bo'sh bo'lsa, Backenddan "Meni taniysanmi?" deb so'raymiz
    // Cookie orqali avtomatik tanib oladi
    if (!user && !storedUser && !hasInitialData.current) {
      const checkAuth = async () => {
        try {
          console.log('� [Auth] Cookie orqali tekshirilmoqda...');
          const res = await fetch(`${SHOXPAY_BACKEND}/api/auth/me`, {
            credentials: 'include' // Kukilarni yuborish uchun shart!
          });
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
            sessionStorage.setItem('user', JSON.stringify(data.data));
            // Tokenni kukidan ololmasligimiz mumkin (httpOnly bo'lsa), 
            // lekin backend keyingi so'rovlarda baribir kukini ishlataveradi
            console.log('✅ [Auth] Cookie orqali tanib olindi');
            refreshData();
          } else {
            setLoading(false);
          }
        } catch (e) {
          setLoading(false);
        }
      };
      checkAuth();
      return;
    }

    // 3. Odatiy yuklanish
    if (storedUser && !user && !hasInitialData.current) {
      hasInitialData.current = true;
      setUser(JSON.parse(storedUser));
      refreshData();
    } else if (!storedUser && !urlToken) {
      setLoading(false);
    }
  }, [user, refreshData]);

  useEffect(() => {
    if (user && !isRefreshing.current) {
      refreshData();
    }
  }, [user?._id, refreshData]);

  const login = (userData: User, token: string) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('access_token', token);
    setUser(userData);
    refreshData();
  };

  const logout = () => {
    sessionStorage.clear();
    localStorage.clear();
    setUser(null);
    setBalance(0);
    setTransactions([]);
    window.location.href = `${import.meta.env.VITE_SHOXPAY_APP_URL}/login`;
  };

  const value = useMemo(() => ({ 
    user, balance, transactions, loading, login, logout, refreshData 
  }), [user, balance, transactions, loading, login, logout, refreshData]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

