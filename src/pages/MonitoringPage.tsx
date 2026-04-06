import React from 'react';
import Monitoring from '../components/Monitoring';

interface MonitoringPageProps {
  refreshTrigger: number;
}

const MonitoringPage: React.FC<MonitoringPageProps> = ({ refreshTrigger }) => {
  return (
    <div className="max-w-md mx-auto px-6 pt-10 animate-fadeIn text-white">
      <h1 className="text-2xl font-black italic tracking-tighter mb-6">
        O'YIN <span className="text-cyan-400">HISOBOTLARI</span>
      </h1>
      <Monitoring refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default MonitoringPage;
