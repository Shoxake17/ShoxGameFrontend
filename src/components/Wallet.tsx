// ============================================
// ShoxPay Frontend: components/Wallet.tsx
// ============================================

import React, { useEffect, useState, useRef } from 'react';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { FaWallet } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

interface WalletProps {
  externalBalance?: number | null;
  onScanClick?: () => void;
}

const Wallet: React.FC<WalletProps> = ({ externalBalance }) => {
  const { user, balance: globalBalance } = useAuth();
  const [balance, setBalance]           = useState<number>(0);
  const [isHidden, setIsHidden]         = useState(false);
  const [isCardHidden, setIsCardHidden] = useState(true);
  const [isUpdated, setIsUpdated]       = useState(false);
  const prevBalanceRef                  = useRef<number>(0);

  useEffect(() => {
    if (globalBalance !== undefined) {
      setBalance(globalBalance);
      prevBalanceRef.current = globalBalance;
    }
  }, [globalBalance]);

  useEffect(() => {
    if (externalBalance == null || externalBalance === prevBalanceRef.current) return;
    prevBalanceRef.current = externalBalance;
    setBalance(externalBalance);
    setIsUpdated(true);
    setTimeout(() => setIsUpdated(false), 2500);
  }, [externalBalance]);

  // Karta raqamini formatlash
  const formatCard = (num: string) => {
    if (!num) return '•••• •••• •••• ••••';
    if (isCardHidden) return `•••• •••• •••• ${num.slice(-4)}`;
    return num.replace(/(\d{4})/g, '$1 ').trim();
  };

  // Balansni render qilish
  const renderBalance = () => {
    if (isHidden) return <span className="text-4xl font-bold">••••••</span>;
    const formatted = balance
      .toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .replace(/,/g, ' ');
    return (
      <div className="flex items-baseline font-bold tracking-tight">
        <span className={`transition-all duration-500 ${isUpdated ? 'text-5xl' : 'text-4xl'}`}>
          {formatted}
        </span>
        <span className="text-lg ml-1.5 opacity-80 font-medium">so'm</span>
      </div>
    );
  };

  return (
    <div className={`rounded-[2.5rem] p-6 text-white mb-10 shadow-2xl relative overflow-hidden group transition-all duration-700 ${
      isUpdated
        ? 'bg-gradient-to-br from-[#10b981] to-[#059669]'
        : 'bg-gradient-to-br from-[#5D67E8] to-[#4f46e5]'
    }`}>
      <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2 opacity-80">
          <FaWallet size={14} />
          <span className="text-[10px] font-semibold tracking-[0.1em] uppercase">
            {isUpdated ? '🎉 Cashback tushdi!' : 'ShoxPay Wallet'}
          </span>
        </div>

        {/* ✅ Scan o'rniga: karta raqamini ko'rsatish/yashirish tugmasi */}
        <button
          onClick={() => setIsCardHidden(p => !p)}
          className="p-2.5 bg-white/15 rounded-xl hover:bg-white/25 active:scale-90 transition-all border border-white/10 backdrop-blur-md"
          title={isCardHidden ? 'Karta raqamini ko\'rsatish' : 'Karta raqamini yashirish'}
        >
          {isCardHidden ? <IoEyeOutline size={20} /> : <IoEyeOffOutline size={20} />}
        </button>
      </div>

      {/* Balans */}
      <div className="relative z-10 mb-1">
        <p className="text-white/60 text-xs font-medium mb-1.5">Mavjud balans</p>
        <div className="flex items-center gap-3">
          {renderBalance()}
          <button
            onClick={() => setIsHidden(p => !p)}
            className="opacity-40 hover:opacity-100 transition-opacity p-1"
          >
            {isHidden ? <IoEyeOutline size={20} /> : <IoEyeOffOutline size={20} />}
          </button>
        </div>
      </div>

      {/* Card Number Info */}
      <div className="relative z-10 mb-1">
        <div className="flex items-center gap-3">
          <p className="text-xl font-mono tracking-[0.2em] font-medium">
            {formatCard(user?.cardNumber || '')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Wallet;