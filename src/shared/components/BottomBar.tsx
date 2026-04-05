// ============================================
// ShoxPay Frontend: components/BottomBar.tsx
// ============================================

import React from 'react';
import { IoQrCodeOutline } from "react-icons/io5";
import { HiHome } from "react-icons/hi";
import {
  MdOutlineAccountBalanceWallet,
  MdOutlineInsertChartOutlined,
  MdPersonOutline,
} from "react-icons/md";

export type ActivePage = 'menu' | 'wallet' | 'monitoring' | 'profile' | 'shoxgame' | 'admin';

interface BottomBarProps {
  onQrClick?:  () => void;
  activePage?: ActivePage;
  onNavigate?: (page: ActivePage) => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  onQrClick,
  activePage = 'menu',
  onNavigate,
}) => {
  const active = (page: ActivePage) => {
    if (page === 'menu') {
      return activePage === 'menu' || 
             activePage === 'super-admin' as any || 
             activePage === 'admin' as any;
    }
    return activePage === page;
  };

  const ic = (page: ActivePage) =>
    active(page) ? 'text-indigo-500' : 'text-gray-400 group-hover:text-white';
  const tx = (page: ActivePage) =>
    active(page) ? 'text-indigo-500' : 'text-gray-500 group-hover:text-white';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#091020]/90 backdrop-blur-lg border-t border-white/10 px-8 py-4 flex justify-between items-center z-50">

      {/* Asosiy */}
      <button
        onClick={() => onNavigate?.('menu')}
        className="flex flex-col items-center group transition-all"
      >
        <HiHome size={28} className={`${ic('menu')} group-active:scale-90 transition-transform`} />
        <span className={`text-[10px] mt-1 font-medium ${tx('menu')}`}>Asosiy</span>
      </button>

      {/* Hamyon */}
      <button
        onClick={() => onNavigate?.('wallet')}
        className="flex flex-col items-center group transition-all"
      >
        <MdOutlineAccountBalanceWallet size={28} className={`${ic('wallet')} group-active:scale-90 transition-transform`} />
        <span className={`text-[10px] mt-1 font-medium ${tx('wallet')}`}>Hamyon</span>
      </button>

      {/* Floating QR */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2">
        <button
          onClick={onQrClick}
          className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_8px_25px_rgba(79,70,229,0.4)] border-4 border-[#091020] active:scale-90 hover:bg-indigo-500 transition-all duration-200"
        >
          <IoQrCodeOutline size={30} />
        </button>
      </div>

      {/* Bo'sh joy */}
      <div className="w-10" />

      {/* Hisobotlar */}
      <button
        onClick={() => onNavigate?.('monitoring')}
        className="flex flex-col items-center group transition-all"
      >
        <MdOutlineInsertChartOutlined size={28} className={`${ic('monitoring')} group-active:scale-90 transition-transform`} />
        <span className={`text-[10px] mt-1 font-medium ${tx('monitoring')}`}>Hisobotlar</span>
      </button>

      {/* Profil */}
      <button
        onClick={() => onNavigate?.('profile')}
        className="flex flex-col items-center group transition-all"
      >
        <MdPersonOutline size={28} className={`${ic('profile')} group-active:scale-90 transition-transform`} />
        <span className={`text-[10px] mt-1 font-medium ${tx('profile')}`}>Profil</span>
      </button>

    </div>
  );
};

export default BottomBar;