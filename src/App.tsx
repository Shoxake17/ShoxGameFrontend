import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Menu from './pages/Menu';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  // Redirect logikasini useEffect ichida boshqarish xavfsizroq
  useEffect(() => {
    if (!loading && !user) {
      // 1. Zaxira manzilni (fallback) qo'shish shart!
      const baseUrl = import.meta.env.VITE_SHOXPAY_APP_URL || "https://shoxpro.uz";
      
      // 2. Agar baseUrl "undefined" degan matn bo'lib qolsa ham to'g'irlaymiz
      const finalBase = (baseUrl === "undefined" || !baseUrl) ? "https://shoxpro.uz" : baseUrl;
      const loginUrl = `${finalBase}/login`;

      console.warn('🚪 [ShoxGame App] Yo\'naltirilmoqda:', loginUrl);
      
      // 3. Cheksiz zanjir hosil bo'lmasligi uchun window.location.replace ishlatamiz
      window.location.replace(loginUrl);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#091020]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // User yo'q bo'lsa, redirect bo'lguncha hech narsa ko'rsatmaymiz
  if (!user) return null;

  // Faqat 'user' roli kirishga ruxsat
  if (user.role !== 'user') {
    const superAdminUrl = import.meta.env.VITE_SHOXPAY_SUPER_ADMIN_APP_URL || "https://super.shoxpro.uz";
    const adminUrl = import.meta.env.VITE_SHOXPAY_GAME_ADMIN_APP_URL || "https://admin-game.shoxpro.uz";
    
    const targetUrl = user.role === 'super-admin' ? superAdminUrl : adminUrl;
    
    // Xavfsiz redirect
    const finalTarget = (targetUrl === "undefined" || !targetUrl) ? "https://shoxpro.uz" : targetUrl;
    window.location.replace(finalTarget);
    return null;
  }

  return (
    <Routes>
      <Route path="/menu"       element={<Menu />} />
      <Route path="/game"       element={<Menu />} />
      <Route path="/wallet"     element={<Menu />} />
      <Route path="/profile"    element={<Menu />} />
      <Route path="/monitoring" element={<Menu />} />

      {/* Default - Cheksiz loopni oldini olish uchun /game ga yo'naltiramiz */}
      <Route path="/" element={<Navigate to="/game" replace />} />
      <Route path="*" element={<Navigate to="/game" replace />} />
    </Routes>
  );
}

export default App;