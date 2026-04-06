// ============================================
// ShoxGame Frontend: pages/Menu.tsx
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomBar, { ActivePage } from '../components/BottomBar';
import { useAuth } from '../context/AuthContext';

// Pages
import ProfileContent from '../pages/Profile';
import ShoxGameContent from '../pages/ShoxGame';
import WalletPage from '../pages/WalletPage';
import MonitoringPage from '../pages/MonitoringPage';

// URL path → sahifa nomi mapping
const PATH_TO_PAGE: Record<string, string> = {
  '/game':       'shoxgame',
  '/menu':       'shoxgame',
  '/wallet':     'wallet',
  '/profile':    'profile',
  '/monitoring': 'monitoring',
};

// Sahifa nomi → URL path mapping
const PAGE_TO_PATH: Record<string, string> = {
  shoxgame:   '/game',
  wallet:     '/wallet',
  profile:    '/profile',
  monitoring: '/monitoring',
};

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // URL dan joriy sahifani aniqlash
  const pageFromPath = PATH_TO_PAGE[location.pathname] ?? 'shoxgame';
  const [activePage, setActivePage] = useState<string>(pageFromPath);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [monitoringTick, setMonitoringTick] = useState(0);

  // URL o'zgarganda active page ni yangilash
  useEffect(() => {
    const page = PATH_TO_PAGE[location.pathname] ?? 'shoxgame';
    setActivePage(page);
  }, [location.pathname]);

  // Sahifaga o'tish — URL ni ham yangilaydi
  const handleNavigate = useCallback(
    (page: ActivePage | string) => {
      const path = PAGE_TO_PATH[page as string] ?? '/game';
      navigate(path);
    },
    [navigate]
  );

  // Kontent render qilish
  const renderContent = () => {
    switch (activePage) {
      case 'profile':
        return (
          <div className="animate-fadeIn">
            <ProfileContent onNavigate={handleNavigate} />
          </div>
        );

      case 'wallet':
        return (
          <WalletPage
            onScanClick={() => setIsQrOpen(true)}
            externalBalance={null}
          />
        );

      case 'monitoring':
        return <MonitoringPage refreshTrigger={monitoringTick} />;

      default:
        // 'shoxgame' va boshqa holatlar
        return (
          <ShoxGameContent
            isQrOpen={isQrOpen}
            setIsQrOpen={setIsQrOpen}
            onSessionEnd={() => setMonitoringTick((t) => t + 1)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#091020] pb-32 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {renderContent()}

      <BottomBar
        activePage={activePage as ActivePage}
        onNavigate={handleNavigate}
        onQrClick={() => setIsQrOpen(true)}
      />
    </div>
  );
};

export default Menu;