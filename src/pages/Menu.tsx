// ============================================
// ShoxGame Frontend: pages/Menu.tsx (User Game App Only)
// ============================================

import React, { useState } from 'react';
import BottomBar, { ActivePage } from '../shared/components/BottomBar';
import { useAuth } from '../context/AuthContext';

// Game App Pages
import ProfileContent from '../roles/user/pages/Profile';
import ShoxGameContent from '../roles/user/pages/ShoxGame';
import WalletPage from '../roles/user/pages/WalletPage';
import MonitoringPage from '../roles/user/pages/MonitoringPage';

const Menu = () => {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>('shoxgame' as any);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [monitoringTick, setMonitoringTick] = useState(0);

  const renderContent = () => {
    switch (activePage as string) {
      case 'profile':
        return (
          <div className="animate-fadeIn">
            <ProfileContent onNavigate={setActivePage} />
          </div>
        );
      
      case 'wallet':
        return <WalletPage onScanClick={() => setIsQrOpen(true)} externalBalance={null} />;
      
      case 'monitoring':
        return <MonitoringPage refreshTrigger={monitoringTick} />;
      
      default:
        return (
          <ShoxGameContent 
            isQrOpen={isQrOpen} 
            setIsQrOpen={setIsQrOpen} 
            onSessionEnd={() => setMonitoringTick(t => t + 1)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#091020] pb-32 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {renderContent()}

      <BottomBar
        activePage={activePage}
        onNavigate={setActivePage}
        onQrClick={() => setIsQrOpen(true)}
      />
    </div>
  );
};

export default Menu;
