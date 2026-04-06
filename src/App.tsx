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
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#091020]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // User yo'q bo'lsa ShoxPay loginiga yo'naltirish
  if (!user) {
    const loginUrl = `${import.meta.env.VITE_SHOXPAY_APP_URL}/login`;
    console.warn('🚪 [ShoxGame App] User topilmadi, yo\'naltirilmoqda:', loginUrl);
    window.location.href = loginUrl;
    return null;
  }

  // Faqat 'user' roli kirishga ruxsat
  if (user.role !== 'user') {
    const targetUrl =
      user.role === 'super-admin'
        ? import.meta.env.VITE_SHOXPAY_SUPER_ADMIN_APP_URL
        : import.meta.env.VITE_SHOXPAY_GAME_ADMIN_APP_URL;
    console.warn('🚫 [ShoxGame App] Noto\'g\'ri rol, yo\'naltirilmoqda:', targetUrl);
    window.location.href = targetUrl;
    return null;
  }

  return (
    <Routes>
      {/* Barcha ichki sahifalar Menu layout ichida */}
      <Route path="/menu"       element={<Menu />} />
      <Route path="/game"       element={<Menu />} />
      <Route path="/wallet"     element={<Menu />} />
      <Route path="/profile"    element={<Menu />} />
      <Route path="/monitoring" element={<Menu />} />

      {/* Default */}
      <Route path="/" element={<Navigate to="/game" replace />} />
      <Route path="*" element={<Navigate to="/game" replace />} />
    </Routes>
  );
}

export default App;