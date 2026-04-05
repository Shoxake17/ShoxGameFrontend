import React from 'react';
import Wallet from '../../../shared/components/Wallet';

interface WalletPageProps {
  onScanClick: () => void;
  externalBalance: number | null;
}

const WalletPage: React.FC<WalletPageProps> = ({ onScanClick, externalBalance }) => {
  return (
    <div className="max-w-md mx-auto px-6 pt-10 animate-fadeIn text-white">
      <h1 className="text-2xl font-black italic tracking-tighter mb-8">
        SHOX<span className="text-cyan-400">WALLET</span>
      </h1>
      <Wallet onScanClick={onScanClick} externalBalance={externalBalance} />
    </div>
  );
};

export default WalletPage;
