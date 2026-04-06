// ============================================
// ShoxPay Frontend: components/Monitoring.tsx
// Mobile dark theme versiya - STABLE & OPTIMIZED
// ============================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { IoFilterOutline, IoCloseOutline, IoRefreshOutline, IoCalendarOutline, IoCheckmark } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';

interface Transaction {
  _id?: string;
  type: string;
  amount: number;
  receipt_id?: string;
  store_name?: string;
  description?: string;
  created_at: string;
}

type QuickFilter = 'all' | 'today' | 'week' | 'month';
type SortFilter  = 'newest' | 'oldest' | 'highest' | 'lowest';

interface MonitoringProps {
  refreshTrigger?: number;
}

// Yordamchi funksiyalar
const fmt = (n: number) =>
  Math.round(n).toLocaleString('uz-UZ', { useGrouping: true }).replace(/,/g, ' ');

const formatDate = (d: string) =>
  new Date(d).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const toDisplayDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
};

const todayISO   = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const Monitoring: React.FC<MonitoringProps> = ({ refreshTrigger = 0 }) => {
  const { transactions: globalTransactions, balance: globalBalance, refreshData, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance]           = useState<number>(0);
  const [loading, setLoading]           = useState(true);
  const [showAll, setShowAll]           = useState(false);
  const [filterOpen, setFilterOpen]     = useState(false);

  // Qo'llangan filterlar
  const [appliedQuick, setAppliedQuick] = useState<QuickFilter>('all');
  const [appliedFrom,  setAppliedFrom]  = useState('');
  const [appliedTo,    setAppliedTo]    = useState('');
  const [appliedSort,  setAppliedSort]  = useState<SortFilter>('newest');

  // Panel ichidagi vaqtinchalik holatlar
  const [panelQuick, setPanelQuick] = useState<QuickFilter>('all');
  const [panelFrom,  setPanelFrom]  = useState('');
  const [panelTo,    setPanelTo]    = useState('');
  const [panelSort,  setPanelSort]  = useState<SortFilter>('newest');

  useEffect(() => {
    if (globalTransactions) {
      setTransactions(globalTransactions);
    }
    if (globalBalance !== undefined) {
      setBalance(globalBalance);
    }
    if (!authLoading) {
      setLoading(false);
    }
  }, [globalTransactions, globalBalance, authLoading]);

  // refreshTrigger o'zgarganda context'ni yangilash
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshData();
    }
  }, [refreshTrigger, refreshData]);

  // ── Filter Logikasi ────────────────────────
  const openFilter = () => {
    setPanelQuick(appliedQuick);
    setPanelFrom(appliedFrom);
    setPanelTo(appliedTo);
    setPanelSort(appliedSort);
    setFilterOpen(true);
  };

  const handlePanelQuick = (q: QuickFilter) => {
    setPanelQuick(q);
    if (q === 'today') { setPanelFrom(todayISO()); setPanelTo(todayISO()); }
    else if (q === 'week')  { setPanelFrom(daysAgoISO(7)); setPanelTo(todayISO()); }
    else if (q === 'month') { setPanelFrom(daysAgoISO(30)); setPanelTo(todayISO()); }
    else { setPanelFrom(''); setPanelTo(''); }
  };

  const applyFilter = () => {
    setAppliedQuick(panelQuick);
    setAppliedFrom(panelFrom);
    setAppliedTo(panelTo);
    setAppliedSort(panelSort);
    setShowAll(false);
    setFilterOpen(false);
  };

  const resetPanel = () => {
    setPanelQuick('all'); setPanelFrom(''); setPanelTo(''); setPanelSort('newest');
  };

  const clearApplied = () => {
    setAppliedQuick('all'); setAppliedFrom(''); setAppliedTo(''); setAppliedSort('newest');
    setShowAll(false);
  };

  // ── Frontend Filtering & Sorting ──────────
  const filtered = useMemo(() => {
    let list = [...transactions];
    
    if (appliedFrom) {
      const from = new Date(appliedFrom + 'T00:00:00');
      list = list.filter(tx => new Date(tx.created_at) >= from);
    }
    if (appliedTo) {
      const to = new Date(appliedTo + 'T23:59:59');
      list = list.filter(tx => new Date(tx.created_at) <= to);
    }

    switch (appliedSort) {
      case 'newest': list.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'oldest': list.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'highest': list.sort((a,b) => b.amount - a.amount); break;
      case 'lowest': list.sort((a,b) => a.amount - b.amount); break;
    }
    return list;
  }, [transactions, appliedFrom, appliedTo, appliedSort]);

  const filteredTotal   = useMemo(() => filtered.reduce((s,tx) => s + tx.amount, 0), [filtered]);
  const visible         = showAll ? filtered : filtered.slice(0, 5);
  const hasActiveFilter = appliedQuick !== 'all' || appliedFrom !== '' || appliedTo !== '' || appliedSort !== 'newest';

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Monitoring</h3>
            {!loading && (
              <p className="text-xs text-indigo-400 mt-0.5">
                {hasActiveFilter
                  ? `${filtered.length} ta natija · ${fmt(filteredTotal)} so'm`
                  : `Jami: ${fmt(balance)} so'm`}
              </p>
            )}
          </div>

          <button
            onClick={openFilter}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold border transition-all active:scale-95 ${
              hasActiveFilter
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <IoFilterOutline size={14} />
            Filtr {hasActiveFilter && "•"}
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white/5 rounded-[1.5rem] p-4 flex items-center gap-4 border border-white/5 animate-pulse">
                <div className="w-12 h-12 bg-white/10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-32" />
                  <div className="h-2 bg-white/5 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bo'sh holat */}
        {!loading && filtered.length === 0 && (
          <div className="border border-white/5 rounded-[1.75rem] p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl">
              {hasActiveFilter ? '🔎' : '🧾'}
            </div>
            <p className="text-white/60 text-sm font-medium">
              {hasActiveFilter ? 'Natija topilmadi' : 'Tranzaksiyalar mavjud emas'}
            </p>
            {hasActiveFilter && (
              <button onClick={clearApplied} className="mt-1 text-xs text-indigo-400">Filtrni tozalash</button>
            )}
          </div>
        )}

        {/* Ro'yxat */}
        {!loading && visible.length > 0 && (
          <div className="space-y-3">
            {visible.map((tx, idx) => {
              const isGaming = tx.type === 'gaming';
              return (
                <div
                  key={tx._id ?? idx}
                  className="bg-white/5 border border-white/5 rounded-[1.75rem] p-4 flex items-center gap-4 hover:bg-white/8 transition-all"
                >
                  <div className={`w-12 h-12 ${isGaming ? 'bg-cyan-500/15' : 'bg-green-500/15'} rounded-full flex items-center justify-center text-xl flex-shrink-0`}>
                    {isGaming ? '🎮' : '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{tx.store_name ?? (isGaming ? 'Gaming' : 'Cashback')}</p>
                    <p className="text-xs text-white/40">{formatDate(tx.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isGaming ? 'text-red-400' : 'text-green-400'} text-sm`}>
                      {isGaming ? '-' : '+'}{fmt(tx.amount)}
                    </p>
                    <p className="text-[10px] text-white/20 font-mono">#{tx.receipt_id?.slice(-6) ?? tx._id?.slice(-6) ?? 'ID'}</p>
                  </div>
                </div>
              );
            })}
            
            {filtered.length > 5 && (
              <button
                onClick={() => setShowAll(p => !p)}
                className="w-full mt-2 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/50 text-xs font-medium"
              >
                {showAll ? "Yashirish ↑" : `Yana ${filtered.length - 5} ta ko'rsatish ↓`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* FILTER BOTTOM SHEET */}
      {filterOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="relative z-10 rounded-t-[2.5rem] bg-[#0e1628] border-t border-white/10">
            <div className="flex justify-center pt-3 pb-2"><div className="w-12 h-1.5 bg-white/10 rounded-full" /></div>
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <button onClick={() => setFilterOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5"><IoCloseOutline size={22} /></button>
              <span className="text-white font-bold">Filtrlash</span>
              <button onClick={resetPanel} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-indigo-400"><IoRefreshOutline size={20} /></button>
            </div>

            <div className="px-6 py-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Tezkor sana */}
              <div className="flex rounded-2xl p-1 gap-1 bg-white/5">
                {(['today', 'week', 'month'] as QuickFilter[]).map(q => (
                  <button
                    key={q}
                    onClick={() => handlePanelQuick(q)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                      panelQuick === q ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-white/40'
                    }`}
                  >
                    {q === 'today' ? 'Bugun' : q === 'week' ? 'Hafta' : 'Oy'}
                  </button>
                ))}
              </div>

              {/* Sana oralig'i */}
              <div className="grid grid-cols-2 gap-4">
                {['Dan', 'Gacha'].map((label, i) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2 ml-1">{label}</p>
                    <label className="relative flex items-center justify-between rounded-2xl px-4 py-4 border border-white/10 bg-white/5">
                      <span className="text-sm font-medium text-white/80">
                        {(i === 0 ? panelFrom : panelTo) ? toDisplayDate(i === 0 ? panelFrom : panelTo) : 'Sana tanlang'}
                      </span>
                      <IoCalendarOutline size={18} className="text-indigo-400" />
                      <input
                        type="date"
                        value={i === 0 ? panelFrom : panelTo}
                        max={todayISO()}
                        onChange={e => {
                          if(i === 0) setPanelFrom(e.target.value);
                          else setPanelTo(e.target.value);
                          setPanelQuick('all');
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                ))}
              </div>

              {/* Saralash */}
              <div className="space-y-2">
                {[
                  { key: 'newest', label: 'Eng yangilari' },
                  { key: 'highest', label: 'Katta summalar' },
                  { key: 'lowest', label: 'Kichik summalar' }
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setPanelSort(s.key as SortFilter)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                      panelSort === s.key ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/5 text-white/40'
                    }`}
                  >
                    <span className="text-sm font-semibold">{s.label}</span>
                    {panelSort === s.key && <IoCheckmark size={20} />}
                  </button>
                ))}
              </div>

              <button
                onClick={applyFilter}
                className="w-full py-5 rounded-[1.5rem] font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform"
              >
                Natijalarni ko'rish
              </button>
              <div className="h-6" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Monitoring;