// ShoxPay App: main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register'; // 'vite-plugin-pwa/register' o'rniga
import App from './App';
import './index.css';


const updateSW = registerSW({
  immediate: true, // Ilova yuklanishi bilan service worker ro'yxatga olinadi
  onNeedRefresh() {
    // Yangi versiya chiqsa, foydalanuvchiga xabar berish yoki avtomatik yangilash
    if (confirm('Ilovaning yangi versiyasi mavjud. Yangilashni xohlaysizmi?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('🚀 ShoxPay oflayn rejimda ishlashga tayyor!');
  },
  onRegisterError(error) {
    console.error('PWA Service Worker ro‘yxatdan o‘tishda xato:', error);
  }
});

import { AuthProvider } from './context/AuthContext';

// ── ROOT RENDER ──
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);