// ShoxPay App: QrCodeScanning.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { IoClose, IoFlashOutline } from 'react-icons/io5';

interface QrProps {
  isOpen: boolean;
  onClose: () => void;
  onCashbackSuccess?: (cashbackAmount: number, newBalance: number) => void;
  onUnlockPC?: (clubId: string, pcNumber: number) => void;
  mode?: 'cashback' | 'unlock'; // Skanerlash rejimini qo'shamiz
}

type ClaimStatus = 'SCANNING' | 'LOADING' | 'SUCCESS' | 'ALREADY_USED' | 'EXPIRED' | 'NOT_FOUND' | 'ERROR' | 'INVALID_SIGNATURE';

interface ClaimResult {
  status: ClaimStatus;
  cashbackAmount?: number;
  totalAmount?: number;
  storeName?: string;
  newBalance?: number;
  cardNumber?: string;
  message?: string;
}

const SHOXPAY_BACKEND = import.meta.env.VITE_BACKEND_URL;

/**
 * 🛡️ QR kod payloadini xavfsiz parslash
 * Format: ID:123456789012|TS:2026-04-01T20:00:00.000Z|SIG:abc123def456
 */
function parseQrData(rawText: string) {
  const data: any = {};
  const parts = rawText.split('|');
  
  parts.forEach(part => {
    // Diqqat: split(':') o'rniga substring ishlatamiz, 
    // chunki Timestamp ichida ham ':' belgilari bor!
    const colonIndex = part.indexOf(':');
    if (colonIndex !== -1) {
      const key = part.substring(0, colonIndex);
      const value = part.substring(colonIndex + 1);
      
      if (key === 'ID') data.receiptId = value;
      if (key === 'TS') data.timestamp = value;
      if (key === 'SIG') data.signature = value;
    }
  });

  return data;
}

const QrCodeScanning: React.FC<QrProps> = ({ isOpen, onClose, onCashbackSuccess, onUnlockPC, mode = 'cashback' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scannedRef = useRef(false);
  
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('SCANNING');
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [manualId, setManualId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isFlashOn, setIsFlashOn] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    streamRef.current = null;
  }, []);

  const claimCashback = useCallback(async (receiptId: string, timestamp?: string, signature?: string) => {
    if (mode !== 'cashback') return; // Faqat cashback rejimida ishlaydi

    setClaimStatus('LOADING');
    stopCamera();

    const token = sessionStorage.getItem('access_token');
    if (!token) {
      setClaimStatus('ERROR');
      setResult({ status: 'ERROR', message: 'Iltimos, avval tizimga kiring' });
      return;
    }

    try {
      const res = await fetch(`${SHOXPAY_BACKEND}/api/cashback/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include',
        body: JSON.stringify({ receiptId, timestamp, signature }),
      });

      const data = await res.json();

      if (data.success) {
        setClaimStatus('SUCCESS');
        setResult({
          status: 'SUCCESS',
          cashbackAmount: data.cashbackAmount,
          totalAmount: data.totalAmount,
          storeName: data.storeName,
          newBalance: data.newBalance,
          cardNumber: data.cardNumber
        });
        if (onCashbackSuccess && data.newBalance != null) {
          onCashbackSuccess(data.cashbackAmount, data.newBalance);
        }
      } else {
        const s = (data.status as ClaimStatus) || 'ERROR';
        setClaimStatus(s);
        setResult({ status: s, message: data.message });
      }
    } catch (err) {
      setClaimStatus('ERROR');
      setResult({ status: 'ERROR', message: "Server bilan bog'lanishda xato" });
    }
  }, [stopCamera, onCashbackSuccess, mode]);

  const handleInput = useCallback((rawText: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    console.log('📡 QR Skanerlandi:', rawText, 'Mode:', mode);

    // --- SHOXGAME PC UNLOCK QR CHECK ---
    if (rawText.startsWith('shoxgame://unlock')) {
      console.log('🔍 ShoxGame QR aniqlandi');
      
      if (mode !== 'unlock') {
        console.warn('⚠️ Noto\'g\'ri rejim: ShoxGame QR skanlandi, lekin mode unlock emas');
        setClaimStatus('ERROR');
        setResult({ status: 'ERROR', message: 'Bu QR kod faqat ShoxGame ilovasida ishlaydi!' });
        return;
      }

      try {
        const queryString = rawText.split('?')[1];
        if (!queryString) throw new Error('Parametrlar topilmadi');
        
        const params = new URLSearchParams(queryString);
        const clubId = params.get('clubId');
        const pcNumber = params.get('pcNumber');
        
        if (clubId && pcNumber && onUnlockPC) {
          console.log('✅ PC Unlock QR muvaffaqiyatli parslash:', { clubId, pcNumber });
          stopCamera();
          onUnlockPC(clubId, parseInt(pcNumber));
          onClose();
          return;
        } else {
          throw new Error('ClubId yoki PC raqami xato');
        }
      } catch (e) {
        console.error('QR Parse Error', e);
        setClaimStatus('ERROR');
        setResult({ status: 'ERROR', message: 'QR kod ma’lumotlari xato!' });
        scannedRef.current = false;
      }
      return;
    }

    // --- CASHBACK QR CHECK ---
    const isCashbackFormat = rawText.includes('|SIG:') || (rawText.length === 12 && /^\d+$/.test(rawText));
    if (isCashbackFormat) {
      console.log('💰 Cashback QR aniqlandi');
      
      if (mode !== 'cashback') {
        console.warn('⚠️ Noto\'g\'ri rejim: Cashback QR skanlandi, lekin mode unlock');
        setClaimStatus('ERROR');
        setResult({ status: 'ERROR', message: 'Bu QR kod faqat ShoxPay ilovasida ishlaydi!' });
        return;
      }

      if (rawText.includes('|SIG:')) {
        const { receiptId, timestamp, signature } = parseQrData(rawText);
        if (receiptId && signature && timestamp) {
          claimCashback(receiptId, timestamp, signature);
          return;
        }
      }

      const receiptId = rawText.replace(/\D/g, '').slice(0, 12);
      if (receiptId.length === 12) {
        claimCashback(receiptId);
        return;
      }
    }

    // Noma'lum format
    console.warn('❓ Noma\'lum QR format:', rawText);
    setClaimStatus('ERROR');
    setResult({ status: 'ERROR', message: 'Noto‘g‘ri QR kod formati' });
    scannedRef.current = false;
  }, [claimCashback, mode, onUnlockPC, onClose, stopCamera]);

  const handleInputRef = useRef(handleInput);
  useEffect(() => { handleInputRef.current = handleInput; }, [handleInput]);

  const scanFrame = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const w = v.videoWidth, h = v.videoHeight;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(v, 0, 0, w, h);
    const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h);

    if (code) {
      handleInputRef.current(code.data);
    } else {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    scannedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        rafRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      setCameraError('Kameraga ulanib bo‘lmadi.');
    }
  }, [scanFrame]);

  useEffect(() => {
    if (isOpen) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const toggleFlash = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        await (track as any).applyConstraints({ advanced: [{ torch: !isFlashOn }] });
        setIsFlashOn(!isFlashOn);
      } catch (_) {}
    }
  }, [isFlashOn]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-md bg-[#091020] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl min-h-[500px]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-white/5 border-b border-white/10">
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white active:scale-90"><IoClose size={24}/></button>
          <h2 className="text-white font-bold">{onUnlockPC ? 'Kompyuterni ochish' : 'QR Cashback'}</h2>
          <div className="w-10"/>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {claimStatus === 'SCANNING' ? (
            <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-indigo-500/30">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-[30px] border-black/40" />
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scanLine_2s_infinite]" />
              <style>{`@keyframes scanLine { 0% { top: 15%; } 50% { top: 85%; } 100% { top: 15%; } }`}</style>
            </div>
          ) : claimStatus === 'LOADING' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-medium">Tekshirilmoqda...</p>
            </div>
          ) : (
            <div className="w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="text-6xl">{claimStatus === 'SUCCESS' ? '💰' : '❌'}</div>
              <div>
                <h3 className="text-white text-2xl font-bold">{claimStatus === 'SUCCESS' ? 'Muvaffaqiyatli!' : 'Xatolik'}</h3>
                <p className="text-white/60 mt-2">{result?.message || (claimStatus === 'SUCCESS' ? 'Keshbek qabul qilindi' : 'Qayta urinib ko‘ring')}</p>
              </div>
              
              {claimStatus === 'SUCCESS' && result && (
                <div className="bg-white/5 rounded-2xl p-5 text-left border border-white/10 space-y-3">
                  <Row label="Dastlabki summa" value={`${result.totalAmount?.toLocaleString()} so'm`} />
                  <Row label="Keshbek (1%)" value={`+${result.cashbackAmount?.toLocaleString()} so'm`} color="text-green-400" />
                  <div className="h-px bg-white/10 my-1" />
                  <Row label="Yangi balans" value={`${result.newBalance?.toLocaleString()} so'm`} color="text-indigo-400" />
                </div>
              )}

              <button 
                onClick={claimStatus === 'SUCCESS' ? onClose : () => { setClaimStatus('SCANNING'); scannedRef.current = false; startCamera(); }}
                className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
              >
                {claimStatus === 'SUCCESS' ? 'Yopish' : 'Qayta urinish'}
              </button>
            </div>
          )}
        </div>

        {/* Footer controls - Faqat cashback rejimida manual input chiqarish */}
        {claimStatus === 'SCANNING' && mode === 'cashback' && (
          <div className="p-6 space-y-4 bg-white/5 border-t border-white/10">
            <button onClick={toggleFlash} className={`mx-auto flex p-4 rounded-full border transition-all active:scale-90 ${isFlashOn ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-white/10 text-white border-white/10'}`}><IoFlashOutline size={24}/></button>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={manualId} 
                onChange={e => setManualId(e.target.value.replace(/\D/g,'').slice(0,12))}
                placeholder="Chek ID (12 raqam)"
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
              />
              <button 
                onClick={() => handleInput(manualId)}
                disabled={manualId.length !== 12}
                className="bg-indigo-500 text-white px-6 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-all"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Footer controls - Unlock rejimida faqat chiroq */}
        {claimStatus === 'SCANNING' && mode === 'unlock' && (
          <div className="p-6 bg-white/5 border-t border-white/10">
            <button onClick={toggleFlash} className={`mx-auto flex p-4 rounded-full border transition-all active:scale-90 ${isFlashOn ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-white/10 text-white border-white/10'}`}><IoFlashOutline size={24}/></button>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) => (
  <div className="flex justify-between items-center text-sm font-medium">
    <span className="text-white/50">{label}</span>
    <span className={color}>{value}</span>
  </div>
);

export default QrCodeScanning;