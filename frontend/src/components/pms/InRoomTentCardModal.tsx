import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Printer, 
  RefreshCw, 
  Wifi, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Utensils, 
  Receipt, 
  CheckCircle,
  Mail,
  Send,
  Lock,
  ExternalLink,
  Check
} from 'lucide-react';
import api from '../../api/client';

interface InRoomTentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomNumber: string;
}

export const InRoomTentCardModal: React.FC<InRoomTentCardModalProps> = ({
  isOpen,
  onClose,
  roomNumber
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [guestEmailInput, setGuestEmailInput] = useState('');
  const [emailDetails, setEmailDetails] = useState<{
    message: string;
    passcode?: string;
    previewUrl?: string;
    isSandbox?: boolean;
    email?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && roomNumber) {
      fetchPortalAccess();
    }
  }, [isOpen, roomNumber]);

  const fetchPortalAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      setEmailDetails(null);
      const res = await api.get(`/pms/frontdesk/room/${roomNumber}/portal-access`);
      setData(res.data.data);
      if (res.data.data?.activeStay?.guestEmail) {
        setGuestEmailInput(res.data.data.activeStay.guestEmail);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load room portal access');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm(`Are you sure you want to regenerate the access passcode for Room ${roomNumber}? The guest will need to enter the new passcode.`)) {
      return;
    }
    try {
      setRegenerating(true);
      const res = await api.post(`/pms/frontdesk/room/${roomNumber}/regenerate-passcode`);
      setData((prev: any) => ({
        ...prev,
        activeStay: {
          ...prev?.activeStay,
          guestAccessCode: res.data.guestAccessCode,
          guestAccessCodeExpiresAt: res.data.guestAccessCodeExpiresAt
        }
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to regenerate passcode');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!guestEmailInput.trim()) {
      alert('Please enter a valid guest email address.');
      return;
    }

    try {
      setSendingEmail(true);
      setEmailDetails(null);
      const res = await api.post(`/pms/frontdesk/room/${roomNumber}/send-passcode-email`, {
        customEmail: guestEmailInput.trim()
      });
      setEmailDetails({
        message: res.data.message || `Passcode emailed to ${guestEmailInput.trim()}!`,
        passcode: res.data.passcode,
        previewUrl: res.data.previewUrl,
        isSandbox: res.data.isSandbox,
        email: guestEmailInput.trim()
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send passcode email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const origin = window.location.origin;
  const qrUrl = `${origin}/room/${roomNumber}`;
  const passcode = data?.activeStay?.guestAccessCode || '------';
  const isOccupied = data?.isOccupied;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container */}
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Navigation Header (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-800">
              In-Room QR Stand & Passcode — Room {roomNumber}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gold-light text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-gold" />
              <span>Print Tent Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Front Desk Staff Email & Passcode Bar (Hidden in Print) */}
        {isOccupied && (
          <div className="print:hidden bg-slate-900 text-white px-6 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="bg-gold/15 border border-gold/40 px-2.5 py-1 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-gold tracking-widest block">Active OTP</span>
                <span className="font-mono text-base font-black text-white tracking-widest">{passcode}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Guest In-Room Verification Passcode</span>
                <span className="text-[10px] text-slate-500">Sent to guest email upon reception approval</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="email"
                value={guestEmailInput}
                onChange={(e) => setGuestEmailInput(e.target.value)}
                placeholder="guest@email.com"
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold w-48 sm:w-56"
              />
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !guestEmailInput.trim()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-light text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                title="Send passcode to guest email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{sendingEmail ? 'Sending...' : 'Email'}</span>
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                title="Reset/Regenerate passcode"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {emailDetails && (
          <div className="print:hidden bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">
                  Passcode [{emailDetails.passcode || passcode}] Dispatched to {emailDetails.email}!
                </span>
                {emailDetails.isSandbox && (
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Development Sandbox Mode: Simulated in-memory email. Click preview button to view the delivered email voucher.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {emailDetails.previewUrl && (
                <a
                  href={emailDetails.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shadow-xs transition-all shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Sent Email</span>
                </a>
              )}
              <button
                onClick={() => setEmailDetails(null)}
                className="text-emerald-600 hover:text-emerald-900 p-1 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col items-center">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium tracking-wide">Loading room portal credentials...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-600">
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={fetchPortalAccess}
                className="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold uppercase text-slate-700 hover:bg-slate-200"
              >
                Retry
              </button>
            </div>
          ) : (
            /* ================= PRINTABLE TENT CARD (GENERIC TO ROOM) ================= */
            <div 
              id="printable-tent-card"
              className="w-full max-w-md bg-gradient-to-b from-slate-950 via-slate-900 to-navy-950 text-white rounded-3xl p-8 border-2 border-gold/40 shadow-2xl relative overflow-hidden text-center flex flex-col items-center print:border-black print:shadow-none print:max-w-none print:m-0 print:p-8 print:w-full"
            >
              {/* Decorative Corner Accents */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

              {/* Brand Header */}
              <div className="mb-4">
                <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-gold text-[10px] font-bold uppercase tracking-widest mb-2">
                  <Sparkles className="w-3 h-3" />
                  <span>Smart In-Room Concierge</span>
                </div>
                <h1 className="font-serif text-xl font-bold tracking-tight text-white uppercase">
                  Grand View Hotel & Suites
                </h1>
                <p className="text-[11px] text-gold-light/80 font-sans tracking-wider uppercase">
                  Addis Ababa • Bole Diplomatic District
                </p>
              </div>

              {/* Room Badge (Generic - No Guest Name) */}
              <div className="mb-5 bg-white/5 border border-white/10 rounded-2xl px-8 py-2.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Assigned Suite</span>
                <span className="font-serif text-3xl font-extrabold text-gold tracking-tight">ROOM {roomNumber}</span>
              </div>

              {/* High-Resolution QR Code */}
              <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-gold/30 mb-4 relative group">
                <QRCodeSVG
                  value={qrUrl}
                  size={175}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23C29B38"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
                    x: undefined,
                    y: undefined,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              </div>

              <p className="text-xs font-semibold text-slate-200 mb-4 max-w-xs">
                Scan with your smartphone camera to connect to your room services.
              </p>

              {/* Email Verification Passcode Notice (No raw code printed) */}
              <div className="w-full bg-slate-900/90 border border-gold/50 rounded-2xl p-4 mb-5 shadow-inner text-left">
                <div className="flex items-center space-x-2 text-gold text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure One-Time Passcode Required</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your 6-digit verification passcode is sent directly to your <strong>registered email address</strong> by Reception upon check-in approval.
                </p>
                <p className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-gold shrink-0" />
                  <span>Passcode expires automatically upon checkout for your security.</span>
                </p>
              </div>

              {/* In-Room Services Grid */}
              <div className="grid grid-cols-3 gap-2 w-full mb-5 text-[11px] text-slate-300">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center">
                  <Utensils className="w-4 h-4 text-gold mb-1" />
                  <span className="font-medium">24/7 Dining</span>
                  <span className="text-[9px] text-slate-400">Room Service</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center">
                  <Receipt className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="font-medium">Live Folio</span>
                  <span className="text-[9px] text-slate-400">Track Bill</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center">
                  <Sparkles className="w-4 h-4 text-teal-400 mb-1" />
                  <span className="font-medium">Concierge</span>
                  <span className="text-[9px] text-slate-400">Housekeeping</span>
                </div>
              </div>

              {/* Wi-Fi QR Code & Fast Auto-Connect Card */}
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-left flex items-center justify-between text-xs gap-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-sm">
                    <QRCodeSVG
                      value={`WIFI:T:WPA;S:${data?.wifiSsid || 'GrandView_Guest_5G'};P:${data?.wifiPassword || 'WelcomeGrandView2026'};;`}
                      size={60}
                      level="M"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 text-gold">
                      <Wifi className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Wi-Fi Instant Connect</span>
                    </div>
                    <span className="font-bold text-white text-xs block mt-0.5">{data?.wifiSsid || 'GrandView_Guest_5G'}</span>
                    <span className="text-[9px] text-slate-400">Scan QR with phone camera</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Password</span>
                  <span className="font-mono font-bold text-gold-light text-xs">{data?.wifiPassword || 'WelcomeGrandView2026'}</span>
                </div>
              </div>

              {/* Front Desk Phone */}
              <div className="mt-3 flex items-center space-x-1 text-[11px] text-slate-400">
                <Phone className="w-3 h-3 text-gold" />
                <span>Front Desk Assistance: Dial <strong className="text-white">0</strong> or <strong className="text-white">+251 11 661 8000</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="print:hidden px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>This tent card is generic to Room {roomNumber} and can remain permanently in the physical room.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>

      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-tent-card, #printable-tent-card * {
            visibility: visible;
          }
          #printable-tent-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0;
            width: 100%;
            max-width: 480px;
            background: #0f172a !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};
