import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  FaGamepad, 
  FaClock, 
  FaSignOutAlt, 
  FaMapMarkerAlt, 
  FaWallet, 
  FaInfoCircle,
  FaCreditCard,
  FaQrcode
} from 'react-icons/fa';
import QrCodeScanning from '../../../shared/components/QrCodeScanning';
import { useAuth } from '../../../context/AuthContext';

interface ShoxGameProps {
  externalBalance?: number;
  onSessionEnd?: () => void;
}

const CLUB_API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/clubs`;

interface ClubItem {
  _id: string;
  name: string;
  address: string;
  pcCount: number;
  phone: string;
  isOpen: boolean;
  computers: {
    number: number;
    type: 'standard' | 'vip';
    pricePerHour: number;
    isAvailable: boolean;
    activeSession?: {
      end_time: string;
      duration: number;
    } | null;
  }[];
}

const ShoxGameContent: React.FC<ShoxGameProps & { isQrOpen?: boolean; setIsQrOpen?: (open: boolean) => void }> = ({ 
  externalBalance, 
  isQrOpen: isQrOpenExternal, 
  setIsQrOpen: setIsQrOpenExternal,
  onSessionEnd 
}) => {
  const { user, balance: globalBalance } = useAuth();
  // Real loyihada bular Socket.io yoki API dan keladi
  const [isActiveSession, setIsActiveSession] = useState<boolean>(false);
  const [timer, setTimer] = useState<string>("00:00:00");
  const [secondsLeft, setSecondsLeft] = useState(0); 
  const [spentAmount, setSpentAmount] = useState<number>(0);
  const [currentPC, setCurrentPC] = useState<string>("");
  const [currentClub, setCurrentClub] = useState<string>("");
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [unlockingPC, setUnlockingPC] = useState<{clubId: string, pcNumber: number, pricePerHour: number} | null>(null);
  const unlockingRef = useRef<{clubId: string, pcNumber: number, pricePerHour: number} | null>(null);
  
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(60);
  
  const [isQrOpenInternal, setIsQrOpenInternal] = useState(false);
  const isQrOpen = isQrOpenExternal !== undefined ? isQrOpenExternal : isQrOpenInternal;
  const setIsQrOpen = setIsQrOpenExternal !== undefined ? setIsQrOpenExternal : setIsQrOpenInternal;

  // Vaqtni formatlash (00:00:00)
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Teskari sanoq taymeri (Active Session uchun)
  useEffect(() => {
    if (!isActiveSession || secondsLeft <= 0) return;
    
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsActiveSession(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActiveSession]);

  // Har 30 soniyada barcha klublardagi PC vaqtlarini yangilash uchun re-render
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000); // 30 soniya
    return () => clearInterval(interval);
  }, []);

  // Soniya o'zgarganda string taymerni yangilash
  useEffect(() => {
    setTimer(formatTime(secondsLeft));
  }, [secondsLeft]);

  // Balansni aniqlash
  const displayBalance = useMemo(() => {
    return externalBalance ?? globalBalance ?? 0;
  }, [externalBalance, globalBalance]);

  // 1. Klublarni yuklash
  const fetchClubs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(CLUB_API_URL, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setClubs(data.data);
      }
    } catch (err) {
      console.error('Klublarni yuklashda xato:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  // 2. Faol sessiyani tekshirish
  useEffect(() => {
    if (!user) return; // Foydalanuvchi bo'lmasa so'rov yubormaymiz

    console.log('📦 ShoxGame: checkActiveSession runs');
    const checkActiveSession = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/shoxgame/active-session`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.success && data.isActive) {
          console.log('🔄 Faol sessiya qayta tiklanmoqda:', data.session);
          setIsActiveSession(true);
          setSecondsLeft(data.session.secondsLeft);
          setSpentAmount(data.session.cost);
          setCurrentClub(data.session.clubName);
          setCurrentPC(`PC-${data.session.pcNumber}`);
        }
      } catch (err) {
        console.error('Faol sessiyani tekshirishda xato:', err);
      }
    };
    checkActiveSession();
  }, [user]);

  // 3. Socket ulanishi
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Socket serverga ulandi:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('⚠️ Socket ulanish xatosi:', err.message);
    });

    newSocket.on('club-status-updated', ({ clubId, isOpen }) => {
      console.log('📢 Klub statusi yangilandi (Real-time)');
      setClubs(prev => prev.map(c => c._id === clubId ? { ...c, isOpen } : c));
    });

    newSocket.on('club-update', (updatedClub: ClubItem) => {
      console.log('📢 Klub yangilandi (Real-time)');
      setClubs(prev => prev.map(c => c._id === updatedClub._id ? updatedClub : c));
    });

    newSocket.on('balance-updated', ({ balance: newBalance }) => {
      console.log('💰 Balans yangilandi (Real-time)');
    });

    newSocket.on('unlock_success', ({ message, newBalance, duration, clubName, cost, pcNumber }) => {
      console.log('✅ Unlock success event received:', { pcNumber, duration });
      alert(message);
      setIsActiveSession(true);
      setSecondsLeft(duration || 60);
      setSpentAmount(cost || 10000); 
      setCurrentClub(clubName || "ShoxGame Club");
      setCurrentPC(`PC-${pcNumber || "01"}`);
    });

    newSocket.on('error', ({ message }) => {
      alert(`Xatolik: ${message}`);
    });

    newSocket.on('pc-status-updated-global', () => {
      console.log('📢 PC statusi yangilandi (Global Real-time)');
      fetchClubs();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [fetchClubs]);

  // PC Unlock funksiyasi (Modalni ochish)
  const handleUnlockPC = useCallback((clubId: string, pcNumber: number, pricePerHour: number = 10000) => {
    console.log('🔓 handleUnlockPC chaqirildi:', { clubId, pcNumber, pricePerHour });
    
    if (!user) {
      alert("Iltimos, avval tizimga kiring.");
      return;
    }
    
    setUnlockingPC({ clubId, pcNumber, pricePerHour });
    setIsDurationModalOpen(true);
  }, [user]);

  // Faktik unlock so'rovi (Modal tasdiqlanganda)
  const confirmUnlock = useCallback(() => {
    if (!unlockingPC || !socket || !user) return;
    
    const { clubId, pcNumber, pricePerHour } = unlockingPC;
    const durationSeconds = selectedMinutes * 60;
    const cost = Math.ceil((pricePerHour / 60) * selectedMinutes);

    console.log(`💰 Balans tekshirilmoqda: ${displayBalance} >= ${cost}`);
    if (displayBalance < cost) {
      alert(`Mablag' yetarli emas! Sizda: ${displayBalance.toLocaleString()} so'm. Kerak: ${cost.toLocaleString()} so'm.`);
      return;
    }

    console.log('🚀 unlock_request yuborilmoqda...', { clubId, pcNumber, userId: user.id || (user as any)._id, duration: durationSeconds });
    socket.emit('unlock_request', {
      clubId,
      pcNumber,
      duration: durationSeconds,
      userId: user.id || (user as any)._id
    });
    
    setIsDurationModalOpen(false);
  }, [socket, user, displayBalance, unlockingPC, selectedMinutes]);

  // QR orqali ochish (narxni aniqlash uchun klubni topish kerak)
  const handleQrUnlock = useCallback((clubId: string, pcNumber: number) => {
    console.log('📸 handleQrUnlock chaqirildi:', { clubId, pcNumber });
    const club = clubs.find(c => c._id === clubId);
    const pc = club?.computers.find(p => p.number === pcNumber);
    const pricePerHour = pc?.pricePerHour || 15000;
    
    if (!club) console.warn(`⚠️ Klub topilmadi: ${clubId}. Standart narx (15,000) ishlatiladi.`);
    
    handleUnlockPC(clubId, pcNumber, pricePerHour);
  }, [clubs, handleUnlockPC]);

  // Karta raqamini formatlash
  const formatCard = (num: string) => {
    if (!num) return '•••• •••• •••• ••••';
    return `•••• •••• •••• ${num.slice(-4)}`;
  };

  // Seansni yakunlash funksiyasi
  const handleEndSession = async () => {
    if(window.confirm("Seansni yakunlamoqchimisiz?")) {
      try {
        const token = sessionStorage.getItem('access_token');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/shoxgame/stop-session`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include' // Cookie orqali autentifikatsiya uchun
        });
        const data = await res.json();
        if (data.success) {
          setIsActiveSession(false);
          setSecondsLeft(0);
          onSessionEnd?.(); // Hisobotlarni yangilash uchun
          alert("Seans yakunlandi.");
        }
      } catch (err) {
        console.error('Seansni yakunlashda xato:', err);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 pt-6 animate-fadeIn pb-24 overflow-y-auto">
      
      {/* ── HEADER & SHARED WALLET ── */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic leading-none">
            SHOX<span className="text-cyan-400">GAME</span>
          </h1>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">CyberZone Explorer</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl flex flex-col items-end shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 text-cyan-400 mb-0.5">
              <FaWallet size={10} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Hamyon</span>
            </div>
            <p className="text-white font-black text-sm tracking-tight">
              {displayBalance.toLocaleString()} <span className="text-[10px] text-gray-400">so'm</span>
            </p>
          </div>
          
         
        </div>
      </div>

      {/* ── ACTIVE SESSION SECTION ── */}
      {isActiveSession ? (
        <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#1a2333] to-[#0d131f] border border-cyan-500/30 rounded-[2.5rem] p-8 mb-10 shadow-[0_20px_60px_-15px_rgba(0,229,255,0.2)]">
          {/* Orqa fondagi neon nurlar */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full w-fit">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Playing</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-cyan-400 shadow-inner">
                <FaGamepad size={24} className="animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <h2 className="text-6xl font-black text-white tracking-tighter italic drop-shadow-2xl">
                  {currentPC}
                </h2>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-2 flex items-center gap-1 italic">
                   <FaMapMarkerAlt size={10} /> {currentClub}
                </p>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <FaClock size={16} />
                  <span className="text-3xl font-mono font-black tracking-tighter drop-shadow-md">
                    {timer}
                  </span>
                </div>
                <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                    <p className="text-gray-500 text-[9px] font-black uppercase">Joriy harajat</p>
                    <p className="text-white font-bold text-xs">-{spentAmount.toLocaleString()} so'm</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleEndSession}
              className="w-full mt-10 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-950/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3 border-t border-white/10"
            >
              <FaSignOutAlt /> Seansni yakunlash
            </button>
          </div>
        </div>
      ) : (
        /* O'yin yo'qligida chiqadigan banner */
        <div className="bg-white/5 border border-dashed border-white/10 rounded-[2rem] p-10 mb-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600 mb-4">
                <FaGamepad size={30} />
            </div>
            <h3 className="text-white font-bold mb-2">Hozirda faol seans yo'q</h3>
            <p className="text-gray-500 text-xs px-4">O'yinni boshlash uchun kompyuter ekranidagi QR kodni skanerlang</p>
        </div>
      )}

      {/* ── CLUB LIST ── */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-black text-lg tracking-tighter italic uppercase">Klublar Ro'yxati</h3>
        <button className="text-cyan-400 text-[10px] font-black uppercase tracking-widest border-b border-cyan-400/30 pb-0.5">Xaritada ko'rish</button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
          </div>
        ) : clubs.length > 0 ? (
          clubs.map((club) => (
            <div 
              key={club._id} 
              className={`group bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.07] rounded-[1.8rem] p-5 flex flex-col gap-4 transition-all duration-300 cursor-pointer active:scale-[0.99] ${!club.isOpen ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center text-cyan-500 text-xl border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">{club.name}</p>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${club.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {club.isOpen ? 'Ochiq' : 'Yopiq'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[9px] mt-1">{club.address}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                  <p className="text-white font-black text-sm tracking-tight">
                    {club.computers?.[0]?.pricePerHour.toLocaleString() || '10,000'}
                  </p>
                  <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">so'm/soatdan</p>
                </div>
              </div>

              {/* Kompyuterlar ro'yxati (Faqat statuslar) */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                {club.computers.map(pc => {
                  const isBooked = pc.activeSession && new Date(pc.activeSession.end_time) > new Date();

                  let statusColor = "bg-red-500/10 border-red-500/20 text-red-400"; // Bo'sh (Red)
                  let statusText = `PC-${pc.number} Bo'sh`;
                  
                  if (isBooked) {
                    // Band qilingan (Sariq)
                    statusColor = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
                    const endTime = new Date(pc.activeSession!.end_time);
                    const formattedEndTime = endTime.toTimeString().slice(0, 5);
                    statusText = `PC-${pc.number} Band (${formattedEndTime})`;
                  }

                  return (
                    <div key={pc.number} className="flex flex-col gap-2">
                      <button
                        onClick={() => !isBooked && handleUnlockPC(club._id, pc.number, pc.pricePerHour)}
                        disabled={isBooked}
                        className={`${statusColor} border py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-all group/pc ${isBooked ? 'cursor-not-allowed opacity-80' : 'hover:scale-[1.02] active:scale-95'}`}
                      >
                        <FaGamepad size={14} className={`${isBooked ? 'text-yellow-400' : 'text-red-400'} group-hover/pc:scale-110 transition-transform`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{statusText}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-gray-500 text-xs">Hozircha klublar yo'q</p>
          </div>
        )}
      </div>

      {/* Info Tag */}
      <div className="mt-10 flex items-center justify-center gap-2 text-gray-600 opacity-50">
        <FaInfoCircle size={10} />
        <p className="text-[9px] font-bold uppercase tracking-widest text-center">
            Avtomatik to'lov tizimi yoqilgan
        </p>
      </div>

      {/* ── QR SCANNER MODAL ── */}
      <QrCodeScanning 
        isOpen={isQrOpen} 
        onClose={() => setIsQrOpen(false)} 
        onUnlockPC={handleQrUnlock}
        mode="unlock"
      />

      {/* ── DURATION SELECTION MODAL ── */}
      {isDurationModalOpen && unlockingPC && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0d131f] border border-white/10 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-white font-black text-xl italic tracking-tighter">VAQTNI TANLANG</h3>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">PC-{unlockingPC.pcNumber} • {currentClub || "ShoxGame"}</p>
                </div>
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                  <FaClock size={20} />
                </div>
              </div>

              <div className="space-y-6">
                {/* Vaqt variantlari */}
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120, 180, 240, 300].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setSelectedMinutes(mins)}
                      className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        selectedMinutes === mins 
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {mins >= 60 ? `${mins/60} soat` : `${mins} min`}
                    </button>
                  ))}
                </div>

                {/* Narx hisoblagich */}
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-[10px] font-black uppercase">Tanlangan vaqt</span>
                    <span className="text-white font-bold text-sm">{selectedMinutes >= 60 ? `${Math.floor(selectedMinutes/60)} soat ${selectedMinutes%60 > 0 ? selectedMinutes%60 + ' min' : ''}` : `${selectedMinutes} minut`}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">Umumiy narx</span>
                    <span className="text-cyan-400 font-black text-xl italic tracking-tighter">
                      {Math.ceil((unlockingPC.pricePerHour / 60) * selectedMinutes).toLocaleString()} <span className="text-[10px] text-gray-500 not-italic">so'm</span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDurationModalOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    onClick={confirmUnlock}
                    className="flex-[2] bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <FaCreditCard /> To'lov va Ochish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoxGameContent;