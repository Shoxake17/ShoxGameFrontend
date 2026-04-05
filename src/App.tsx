import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Menu from './pages/Menu';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();
  console.log('📱 [ShoxGame App] Render qilinmoqda:', { loading, hasUser: !!user });

  if (loading) {
    console.log('⏳ [ShoxGame App] Yuklanmoqda...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#091020]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Agar user yo'q bo'lsa, ShoxPayFrontend ga login uchun yuboramiz
  if (!user) {
    const loginUrl = `${import.meta.env.VITE_SHOXPAY_APP_URL}/login`;
    console.warn('🚪 [ShoxGame App] User topilmadi, ShoxPay loginiga yo\'naltirilmoqda:', loginUrl);
    window.location.href = loginUrl;
    return null;
  }

  console.log('✅ [ShoxGame App] Foydalanuvchi tasdiqlandi:', user.firstName, 'Roli:', user.role);

  // Faqat user rolidagilar kira oladi
  if (user.role !== 'user') {
    const targetUrl = user.role === 'super-admin' 
      ? import.meta.env.VITE_SHOXPAY_SUPER_ADMIN_APP_URL 
      : import.meta.env.VITE_SHOXPAY_GAME_ADMIN_APP_URL;
    console.warn('🚫 [ShoxGame App] Noto\'g\'ri rol, yo\'naltirilmoqda:', targetUrl);
    window.location.href = targetUrl;
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;