import React from 'react';
import { IoPersonOutline, IoTimeOutline, IoCheckmarkCircle, IoShieldCheckmarkOutline, IoStatsChartOutline } from 'react-icons/io5';
import { MdOutlineSecurity, MdOutlineAccountBalanceWallet } from 'react-icons/md';
import { FiHeadphones, FiPlus, FiLogOut } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  cardBg: 'bg-[#1C2135]',
  textMain: 'text-white',
  textSub: 'text-[#8A94A6]',
  accentBg: 'bg-[#6E56F8]',
  verified: 'text-[#05df72]',
  danger: 'text-[#FF453A]',
};

const MenuBlock = ({ icon, title, label, onClick, colorClass = COLORS.textMain }: any) => (
  <button 
    onClick={onClick}
    className={twMerge(COLORS.cardBg, 'p-5 rounded-3xl flex flex-col items-start gap-3 w-full transition-all hover:bg-[#262D4A] active:scale-95 text-left shadow-lg border border-white/5')}
  >
    <div className={twMerge(colorClass, "text-2xl")}>{icon}</div>
    <div>
      <h4 className={twMerge(colorClass, "font-bold text-sm")}>{title}</h4>
      <p className="text-[#8A94A6] text-[10px]">{label}</p>
    </div>
  </button>
);

const ProfileContent = ({ onNavigate }: { onNavigate?: (page: any) => void }) => {
  const { user, logout } = useAuth();

  // ── Chiqish funksiyasi ────────
  const handleLogout = () => {
    logout();
    window.location.href = '/'; 
  };

  if (!user) return <div className="text-white p-10 text-center">Yuklanmoqda...</div>;

  return (
    <div className="max-w-md mx-auto px-6 pt-6 pb-20 animate-fadeIn">
      
      {/* Foydalanuvchi Ma'lumotlari (Avatar bilan) */}
      <div className={twMerge(COLORS.cardBg, 'p-6 rounded-3xl flex items-center gap-4 mb-8 border border-white/5 shadow-xl relative overflow-hidden')}>
        
        {/* Orqa fondagi dizayn uchun yengil nur */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

        {/* Avatar Qismi */}
        <div className="relative shrink-0">
          {user.picture || user.avatar ? (
            <img 
              src={user.picture || user.avatar} 
              alt="Profile" 
              className="w-16 h-16 rounded-full border-2 border-indigo-500/50 object-cover shadow-md"
              onError={(e) => {
                // Agar rasm yuklanmasa (masalan, link noto'g'ri bo'lsa) fallback ko'rsatadi
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.firstName}&background=6E56F8&color=fff`;
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-[#6E56F8] to-[#4A3AFF] rounded-full flex items-center justify-center text-2xl border-2 border-white/10 text-white font-bold shadow-lg">
              {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
            </div>
          )}
          {/* Onlayn status belgisi */}
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#05df72] border-2 border-[#1C2135] rounded-full shadow-sm"></div>
        </div>

        {/* Matnli ma'lumotlar */}
        <div className="flex-1 z-10">
          <h2 className="text-white font-bold text-lg leading-tight truncate">
            {user.firstName} {user.lastName || ''}
          </h2>
          <p className="text-[#8A94A6] text-xs mb-1 truncate">{user.email}</p>
          {user.cardNumber && (
            <p className="text-indigo-400 text-[10px] font-mono mb-1">
              **** **** **** {user.cardNumber.slice(-4)}
            </p>
          )}
          <div className="flex items-center gap-1">
            <IoCheckmarkCircle className={COLORS.verified} />
            <span className="text-[#05df72] text-[10px] font-bold uppercase tracking-wider">Tasdiqlangan</span>
          </div>
        </div>
      </div>

      {/* Admin Panel Link (Agar Admin bo'lsa) */}
      {(user.role === 'admin' || user.role === 'super-admin') && (
        <div className="mb-8">
          <h3 className="text-white font-bold mb-4 px-1">Boshqaruv</h3>
          <div className="grid grid-cols-1 gap-4">
            {user.role === 'super-admin' && (
              <MenuBlock 
                icon={<IoStatsChartOutline className="text-purple-400" />} 
                title="Tizim Statistikasi" 
                label="Barcha balans va foydalanuvchilar" 
                onClick={() => onNavigate?.('super-admin' as any)}
              />
            )}
            <MenuBlock 
              icon={<IoShieldCheckmarkOutline className="text-indigo-400" />} 
              title="Foydalanuvchilar" 
              label="Ro'yxatni ko'rish va boshqarish" 
              onClick={() => onNavigate?.('admin-management' as any)}
            />
          </div>
        </div>
      )}

      {/* Sozlamalar Grid */}
      <h3 className="text-white font-bold mt-6 mb-4 px-1 flex justify-between items-center">
        <span>Profil Sozlamalari</span>
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <MenuBlock 
          icon={<IoPersonOutline />} 
          title="Ma'lumotlar" 
          label="Profilni tahrirlash" 
        />
        <MenuBlock 
          icon={<MdOutlineSecurity />} 
          title="Xavfsizlik" 
          label="PIN kodni o'zgartirish" 
        />
        <MenuBlock 
          icon={<IoTimeOutline />} 
          title="Tarix" 
          label="Amallar tarixi" 
        />
        <MenuBlock 
          icon={<FiHeadphones />} 
          title="Aloqa" 
          label="Support xizmati" 
        />
        
        {/* Logout tugmasi */}
        <div className="col-span-2 mt-2">
            <MenuBlock 
              icon={<FiLogOut />} 
              title="Tizimdan chiqish" 
              colorClass="text-red-400"
              onClick={handleLogout}
            />
        </div>
      </div>
      
    </div>
  );
};

export default ProfileContent;