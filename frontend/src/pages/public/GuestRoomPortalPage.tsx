import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Utensils, 
  Receipt, 
  Sparkles, 
  Clock, 
  Wifi, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  LogOut, 
  Plus, 
  Minus, 
  ShoppingBag, 
  X, 
  ChevronRight, 
  BedDouble, 
  Coffee, 
  BellOff, 
  Bell,
  ArrowRight,
  Info,
  Calendar,
  CreditCard,
  Wine,
  HelpCircle,
  ExternalLink,
  Timer,
  QrCode,
  Moon,
  Sun,
  Bed
} from 'lucide-react';
import guestClient from '../../api/guestClient';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export const GuestRoomPortalPage: React.FC = () => {
  const { roomNumber: paramRoom } = useParams<{ roomNumber?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialRoom = paramRoom || searchParams.get('room') || '103';

  // Auth state
  const [roomNumberInput, setRoomNumberInput] = useState(initialRoom);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('guest_portal_token'));

  // Checkout Eviction state
  const [isCheckoutEvicted, setIsCheckoutEvicted] = useState<boolean>(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string>('');
  const [roomPublicStatus, setRoomPublicStatus] = useState<{ isOccupied: boolean; message: string } | null>(null);

  // Main stay data
  const [stayData, setStayData] = useState<any>(null);
  const [loadingStay, setLoadingStay] = useState(false);
  const [activeTab, setActiveTab] = useState<'dining' | 'expenses' | 'services' | 'tracker'>('dining');

  // Dining / Menu state
  const [menuCategories, setMenuCategories] = useState<Record<string, any[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Folio Expenses state
  const [folioData, setFolioData] = useState<any>(null);
  const [loadingFolio, setLoadingFolio] = useState(false);

  // Service requests state
  const [submittingService, setSubmittingService] = useState(false);
  const [customRequestText, setCustomRequestText] = useState('');
  const [customRequestCat, setCustomRequestCat] = useState<'HOUSEKEEPING' | 'MAINTENANCE' | 'CONCIERGE'>('HOUSEKEEPING');
  const [serviceSuccessMsg, setServiceSuccessMsg] = useState<string | null>(null);

  // Live Orders & Requests state
  const [activityOrders, setActivityOrders] = useState<any[]>([]);
  const [activityRequests, setActivityRequests] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // UI state
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [togglingDnd, setTogglingDnd] = useState(false);

  // Day Finished & Good Night state
  const [dayFinishedModalOpen, setDayFinishedModalOpen] = useState(false);
  const [submittingDayFinished, setSubmittingDayFinished] = useState(false);
  const [resumingDay, setResumingDay] = useState(false);
  const [nightDndEnabled, setNightDndEnabled] = useState(true);
  const [nightWakeUpTime, setNightWakeUpTime] = useState('07:00 AM');
  const [customWakeUpInput, setCustomWakeUpInput] = useState('');
  const [nightTurndown, setNightTurndown] = useState(true);
  const [nightBreakfastPref, setNightBreakfastPref] = useState('RESTAURANT_BUFFET');
  const [nightSpecialNotes, setNightSpecialNotes] = useState('');
  const [dayFinishedSuccessMsg, setDayFinishedSuccessMsg] = useState<string | null>(null);

  // Live timer tick (updates every second for ticking countdowns)
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timerInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Check public status of the room (whether currently occupied or checked out)
  const checkRoomStatus = async (roomNum: string) => {
    try {
      const res = await guestClient.get(`/guest-portal/room-status/${roomNum}`);
      setRoomPublicStatus(res.data);
    } catch {
      setRoomPublicStatus(null);
    }
  };

  useEffect(() => {
    if (initialRoom) {
      setRoomNumberInput(initialRoom);
    }
  }, [initialRoom]);

  // Evict guest immediately when check-out is finished
  const handleCheckoutEviction = (message?: string) => {
    localStorage.removeItem('guest_portal_token');
    setToken(null);
    setStayData(null);
    setCart([]);
    setIsCartOpen(false);
    setIsCheckoutEvicted(true);
    setCheckoutMessage(
      message || 'Your stay has concluded and check-out is complete. In-room portal access has expired. Thank you for staying with Grand View Hotel & Suites!'
    );
  };

  // Listen for real-time checkout detected from API interceptors
  useEffect(() => {
    const onCheckoutEvent = (e: any) => {
      handleCheckoutEviction(e.detail?.message);
    };
    window.addEventListener('guest_checkout_detected', onCheckoutEvent);
    return () => window.removeEventListener('guest_checkout_detected', onCheckoutEvent);
  }, []);

  // Poll room public status if not logged in
  useEffect(() => {
    if (!token && roomNumberInput) {
      checkRoomStatus(roomNumberInput);
    }
  }, [token, roomNumberInput]);

  // Load stay data when token exists
  useEffect(() => {
    if (token) {
      fetchStayInfo();
      fetchMenu();
      fetchActivity();

      // Poll activity every 8 seconds to stay synced with kitchen prep updates & detect check-out immediately
      const activityInterval = setInterval(fetchActivity, 8000);
      return () => clearInterval(activityInterval);
    }
  }, [token]);

  // Load tab-specific data
  useEffect(() => {
    if (token) {
      if (activeTab === 'expenses') {
        fetchFolio();
      } else if (activeTab === 'tracker') {
        fetchActivity();
      }
    }
  }, [activeTab, token]);

  const handleLogin = async (e?: React.FormEvent, directPasscode?: string) => {
    if (e) e.preventDefault();
    const code = directPasscode || passcodeInput.trim();
    const room = roomNumberInput.trim();

    if (!room || !code) {
      setAuthError('Please provide both your physical room number and 6-digit passcode.');
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError(null);
      setIsCheckoutEvicted(false);
      const res = await guestClient.post('/guest-portal/login', {
        roomNumber: room,
        passcode: code
      });

      const newToken = res.data.token;
      localStorage.setItem('guest_portal_token', newToken);
      setToken(newToken);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Authentication failed. Please verify your room number and passcode or contact the front desk.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('guest_portal_token');
    setToken(null);
    setStayData(null);
    setCart([]);
    setIsCartOpen(false);
  };

  const fetchStayInfo = async () => {
    try {
      setLoadingStay(true);
      const res = await guestClient.get('/guest-portal/stay');
      setStayData(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
      }
    } finally {
      setLoadingStay(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await guestClient.get('/guest-portal/menu');
      setMenuCategories(res.data.categories || {});
    } catch (err: any) {
      console.error('Failed to load menu', err);
    }
  };

  const fetchFolio = async () => {
    try {
      setLoadingFolio(true);
      const res = await guestClient.get('/guest-portal/folio');
      setFolioData(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
      } else {
        console.error('Failed to load folio', err);
      }
    } finally {
      setLoadingFolio(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setLoadingActivity(true);
      const res = await guestClient.get('/guest-portal/activity');
      setActivityOrders(res.data.data?.orders || []);
      setActivityRequests(res.data.data?.requests || []);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
      } else {
        console.error('Failed to load activity', err);
      }
    } finally {
      setLoadingActivity(false);
    }
  };

  const toggleDnd = async () => {
    try {
      setTogglingDnd(true);
      const res = await guestClient.post('/guest-portal/dnd');
      setStayData((prev: any) => ({
        ...prev,
        stay: {
          ...prev?.stay,
          doNotDisturb: res.data.doNotDisturb
        }
      }));
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
        return;
      }
      alert(err.response?.data?.error || 'Failed to toggle DND');
    } finally {
      setTogglingDnd(false);
    }
  };

  const handlePlaceDayFinished = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingDayFinished(true);
      const wakeTime = nightWakeUpTime === 'CUSTOM' ? customWakeUpInput.trim() : (nightWakeUpTime === 'NONE' ? '' : nightWakeUpTime);
      
      const payload = {
        enableDnd: nightDndEnabled,
        wakeUpCallTime: wakeTime,
        turndownRequested: nightTurndown,
        turndownItem: 'Extra mineral water & night turndown',
        breakfastPreference: nightBreakfastPref === 'NONE' ? '' : (nightBreakfastPref === 'RESTAURANT_BUFFET' ? 'Restaurant Buffet (Ground Floor)' : 'Room Service Breakfast Delivery'),
        notes: nightSpecialNotes.trim()
      };

      const res = await guestClient.post('/guest-portal/day-finished', payload);
      
      setStayData((prev: any) => ({
        ...prev,
        stay: {
          ...prev?.stay,
          dayFinished: true,
          dayFinishedAt: res.data.dayFinishedAt,
          wakeUpCallTime: res.data.wakeUpCallTime,
          turndownRequested: res.data.turndownRequested,
          breakfastPreference: res.data.breakfastPreference,
          dayFinishedNotes: res.data.dayFinishedNotes,
          doNotDisturb: res.data.doNotDisturb
        }
      }));

      setDayFinishedSuccessMsg(res.data.message || 'Day marked as finished! Front Desk reception has been notified.');
      setDayFinishedModalOpen(false);
      fetchActivity();
      setTimeout(() => setDayFinishedSuccessMsg(null), 8000);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
        return;
      }
      alert(err.response?.data?.error || 'Failed to submit Day Finished request');
    } finally {
      setSubmittingDayFinished(false);
    }
  };

  const handleReopenDay = async () => {
    try {
      setResumingDay(true);
      const res = await guestClient.post('/guest-portal/day-reopen');
      setStayData((prev: any) => ({
        ...prev,
        stay: {
          ...prev?.stay,
          dayFinished: false
        }
      }));
      setDayFinishedSuccessMsg(res.data.message || 'Day resumed! Daytime services and concierge are active.');
      fetchActivity();
      setTimeout(() => setDayFinishedSuccessMsg(null), 6000);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
        return;
      }
      alert(err.response?.data?.error || 'Failed to resume day');
    } finally {
      setResumingDay(false);
    }
  };

  const copyWifiPassword = () => {
    if (stayData?.hotelInfo?.wifiPassword) {
      navigator.clipboard.writeText(stayData.hotelInfo.wifiPassword);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  // Cart operations
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item._id);
      if (existing) {
        return prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateCartQty = (menuItemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.menuItemId === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.15);
  const cartService = Math.round(cartSubtotal * 0.10);
  const cartTotal = cartSubtotal + cartTax + cartService;
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      setPlacingOrder(true);
      const res = await guestClient.post('/guest-portal/order', {
        items: cart,
        notes: orderNotes
      });

      setOrderSuccessMsg(res.data.message || 'Your room service order has been sent to the kitchen!');
      setCart([]);
      setIsCartOpen(false);
      setOrderNotes('');
      setTimeout(() => setOrderSuccessMsg(null), 6000);
      setActiveTab('tracker');
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
        return;
      }
      alert(err.response?.data?.error || 'Failed to place room service order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleQuickServiceRequest = async (category: string, item: string, instructions?: string) => {
    try {
      setSubmittingService(true);
      const res = await guestClient.post('/guest-portal/service-request', {
        category,
        item,
        specialInstructions: instructions || ''
      });
      setServiceSuccessMsg(res.data.message || `Request for "${item}" submitted to hotel staff.`);
      setTimeout(() => setServiceSuccessMsg(null), 5000);
      setActiveTab('tracker');
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
        return;
      }
      alert(err.response?.data?.error || 'Failed to submit service request');
    } finally {
      setSubmittingService(false);
    }
  };

  const handleCustomServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRequestText.trim()) return;
    try {
      setSubmittingService(true);
      const res = await guestClient.post('/guest-portal/service-request', {
        category: customRequestCat,
        item: customRequestText.trim(),
        specialInstructions: 'Guest in-room custom request'
      });
      setServiceSuccessMsg(res.data.message || 'Your service request has been received!');
      setCustomRequestText('');
      setTimeout(() => setServiceSuccessMsg(null), 5000);
      setActiveTab('tracker');
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleCheckoutEviction(err.response?.data?.error);
        return;
      }
      alert(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmittingService(false);
    }
  };

  const allMenuItems = Object.values(menuCategories).flat();
  const displayedItems = selectedCategory === 'ALL' 
    ? allMenuItems 
    : (menuCategories[selectedCategory] || []);

  // =========================================================================
  // VIEW 0: CHECK-OUT COMPLETED & GUEST PORTAL ACCESS DEACTIVATED SCREEN
  // =========================================================================
  if (isCheckoutEvicted) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
        <header className="max-w-md w-full mx-auto text-center pt-8 pb-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Grand View Hotel & Suites • Stay Concluded</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Check-out Complete
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
            Your stay has concluded and in-room concierge access has ended.
          </p>
        </header>

        <div className="max-w-lg w-full mx-auto bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 my-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto mb-5 text-amber-700 shadow-xs">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-bold uppercase tracking-wider mb-3">
            <BedDouble className="w-3.5 h-3.5 text-stone-600" />
            <span>Room {roomNumberInput} • Checked Out</span>
          </div>

          <h2 className="text-xl font-serif font-bold text-slate-900 mb-2">
            Thank You for Staying With Us!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            {checkoutMessage || 'Your departure has been finalized at Front Desk. Your room passcode has expired and in-room portal services are now deactivated.'}
          </p>

          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 mb-1">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Folio & Invoice</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All room dining, service fees, and taxes were reconciled and closed at Front Desk.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Passcode Deactivated</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your 6-digit one-time access code has been securely erased for future guests.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/booking')}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-100 font-bold text-sm uppercase tracking-wider shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center space-x-2"
            >
              <span>Book Your Next Stay</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Hotel Homepage
              </button>
              <button
                onClick={() => {
                  setIsCheckoutEvicted(false);
                  setPasscodeInput('');
                  setAuthError(null);
                }}
                className="flex-1 py-3 rounded-2xl border border-stone-200 hover:bg-stone-50 text-slate-600 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Sign In Different Room
              </button>
            </div>
          </div>
        </div>

        <footer className="max-w-md w-full mx-auto text-center py-6 text-xs text-slate-500">
          <p>Grand View Hotel & Suites • Addis Ababa, Ethiopia</p>
          <p className="text-[11px] text-slate-400 mt-1">For baggage claim or airport shuttle assistance, please contact Front Desk.</p>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: LIGHT MODE LOGIN SCREEN (AUTHENTIC LUXURY HOTEL CONCIERGE)
  // =========================================================================
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
        {/* Top Header */}
        <header className="max-w-md w-full mx-auto text-center pt-8 pb-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Grand View Hotel & Suites • In-Room Services</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Guest Room Concierge
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
            Order in-room dining, request fresh linens, toggle Do Not Disturb, and view your real-time bill.
          </p>
        </header>

        {/* Login Card */}
        <div className="max-w-md w-full mx-auto bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/50">
          {/* Room Checked-out / Unoccupied Alert */}
          {roomPublicStatus && !roomPublicStatus.isOccupied && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs flex items-start space-x-3">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Room {roomNumberInput} is Currently Unoccupied</p>
                <p className="mt-0.5 text-amber-900 leading-relaxed">
                  This room has no active guest stay or has been checked out. One-time passcodes are generated upon Front Desk check-in.
                </p>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Verification Error</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Room Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roomNumberInput}
                  onChange={(e) => setRoomNumberInput(e.target.value)}
                  placeholder="e.g. 103"
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-3 text-lg font-bold text-slate-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all"
                  required
                />
                <BedDouble className="w-5 h-5 text-stone-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Verification Passcode
                </label>
                <span className="text-[11px] text-amber-800 font-medium">6-Digit Code</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-3 text-2xl font-mono tracking-[0.35em] text-center font-bold text-slate-900 placeholder-stone-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all"
                  required
                />
                <ShieldCheck className="w-5 h-5 text-stone-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Sent to your email upon check-in approval, or provided by the front desk.
              </p>
            </div>

            {/* Quick Demo Helper Pill */}
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">Room 103 Active Passcode</span>
                <span className="font-mono text-sm font-bold text-amber-950">462811</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRoomNumberInput('103');
                  setPasscodeInput('462811');
                  handleLogin(undefined, '462811');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold tracking-wide transition-all shadow-xs"
              >
                1-Click Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-100 font-bold text-sm uppercase tracking-wider shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{authLoading ? 'Verifying Credentials...' : 'Open In-Room Portal'}</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </form>

          {/* Assistance Footer */}
          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-amber-700" />
              <span>Reception Assistance: Dial <strong className="text-slate-900">0</strong> from your room phone</span>
            </div>
          </div>
        </div>

        {/* Brand Signature */}
        <footer className="text-center py-4 text-xs text-slate-400">
          Grand View Hotel & Suites • Cameroon St, Bole Sub-City, Addis Ababa, Ethiopia
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED LIGHT MODE IN-ROOM CONCIERGE EXPERIENCE
  // =========================================================================
  const room = stayData?.room;
  const guest = stayData?.guest;
  const stay = stayData?.stay;
  const hotelInfo = stayData?.hotelInfo;

  // Active food order prep timer tracking
  const activeFoodOrderWithTimer = activityOrders.find(
    (o) => (o.status === 'NEW' || o.status === 'PREPARING' || o.status === 'READY') && o.estimatedReadyAt
  );
  const topOrderRemainingSec = activeFoodOrderWithTimer?.estimatedReadyAt
    ? Math.max(0, Math.floor((new Date(activeFoodOrderWithTimer.estimatedReadyAt).getTime() - now) / 1000))
    : 0;

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-slate-900 flex flex-col font-sans">
      
      {/* Refined Luxury Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 flex items-center justify-center font-serif font-bold text-base shadow-xs">
              GV
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-slate-900 text-sm sm:text-base tracking-wide">
                  Grand View Hotel
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-amber-200 px-2.5 py-0.5 rounded-full font-mono">
                  Room {room?.roomNumber || initialRoom}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {guest?.name ? `Guest: ${guest.name}` : (room?.roomType || 'Standard Double Room')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-rose-200 hover:bg-rose-50/50 transition-all"
              title="Sign out of guest portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 pb-28 space-y-5">
        
        {/* Quick Room Banner & Wi-Fi & DND & Day Finished Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Wi-Fi Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/50 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">High-Speed Wi-Fi</span>
                <span className="text-xs font-bold text-slate-900">{hotelInfo?.wifiSsid || 'GrandView_Guest_5G'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setWifiModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 transition-all text-[11px] font-bold flex items-center space-x-1 shadow-2xs"
                title="Scan Wi-Fi QR Code with phone camera"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-800" />
                <span>QR Code</span>
              </button>
              <button
                onClick={copyWifiPassword}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 transition-all text-[11px] font-semibold flex items-center space-x-1"
                title="Copy Wi-Fi Password"
              >
                {copiedWifi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWifi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* DND Toggle Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stay?.doNotDisturb ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-stone-100 text-stone-600'}`}>
                {stay?.doNotDisturb ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Privacy (DND)</span>
                <span className={`text-xs font-bold ${stay?.doNotDisturb ? 'text-rose-700' : 'text-slate-800'}`}>
                  {stay?.doNotDisturb ? 'Do Not Disturb Active' : 'Service Welcome'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleDnd}
              disabled={togglingDnd}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                stay?.doNotDisturb 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
              }`}
            >
              {togglingDnd ? '...' : (stay?.doNotDisturb ? 'Turn Off' : 'Set DND')}
            </button>
          </div>

          {/* Day Finished / Sleep Mode Card */}
          <div className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all ${
            stay?.dayFinished 
              ? 'bg-indigo-950/5 border-indigo-300 ring-1 ring-indigo-200' 
              : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                stay?.dayFinished 
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                  : 'bg-slate-100 text-slate-700'
              }`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Night Status</span>
                <span className={`text-xs font-bold ${stay?.dayFinished ? 'text-indigo-950' : 'text-slate-800'}`}>
                  {stay?.dayFinished ? 'Day Concluded' : 'Day Active'}
                </span>
              </div>
            </div>
            {stay?.dayFinished ? (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setDayFinishedModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold transition-all shadow-2xs"
                  title="View or Edit Night Settings"
                >
                  Edit
                </button>
                <button
                  onClick={handleReopenDay}
                  disabled={resumingDay}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all shadow-2xs flex items-center space-x-1"
                  title="Resume Daylight Mode"
                >
                  <Sun className="w-3 h-3 text-amber-700" />
                  <span>{resumingDay ? '...' : 'Resume'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDayFinishedModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Finish Day</span>
              </button>
            )}
          </div>

          {/* Reception Call */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Front Desk</span>
                <span className="text-xs font-bold text-slate-900">Ext. 0 / +251 11 661 8000</span>
              </div>
            </div>
            <a
              href="tel:+251116618000"
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all"
            >
              Call
            </a>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {dayFinishedSuccessMsg && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center space-x-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold">{dayFinishedSuccessMsg}</span>
          </div>
        )}

        {/* Persistent Good Night & Day Concluded Mode Banner */}
        {stay?.dayFinished && (
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">🌙 Good Night Mode Active</span>
                  <span className="text-[10px] bg-indigo-500/40 text-indigo-200 font-mono px-2 py-0.5 rounded-full border border-indigo-400/30 font-semibold">
                    Reception Notified
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {stay.wakeUpCallTime 
                    ? `Morning wake-up call set for ${stay.wakeUpCallTime}. Sleep well, ${(guest as any)?.name || 'Guest'}!`
                    : `In-room quiet hours & Do Not Disturb are active. Sleep well, ${(guest as any)?.name || 'Guest'}!`}
                  {stay.turndownRequested ? ' Evening turndown service is dispatched.' : ''}
                  {stay.breakfastPreference ? ` Breakfast: ${stay.breakfastPreference}.` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setDayFinishedModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all"
              >
                Change Call
              </button>
              <button
                onClick={handleReopenDay}
                disabled={resumingDay}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{resumingDay ? 'Resuming...' : 'Resume Day'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Feedback Banners */}
        {orderSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{orderSuccessMsg}</span>
          </div>
        )}
        {serviceSuccessMsg && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center space-x-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium">{serviceSuccessMsg}</span>
          </div>
        )}

        {/* Live Kitchen Preparation Timer Announcement Banner */}
        {activeFoodOrderWithTimer && (
          <div 
            onClick={() => setActiveTab('tracker')}
            className="p-4 bg-amber-50 hover:bg-amber-100/80 border border-amber-300/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-200/70 border border-amber-300 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <Timer className="w-5 h-5 text-amber-900 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">Room Service #{activeFoodOrderWithTimer.orderNumber}</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                    {activeFoodOrderWithTimer.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {topOrderRemainingSec > 0 
                    ? `Chef is actively cooking. Estimated ready in approximately ${Math.floor(topOrderRemainingSec / 60)}m ${String(topOrderRemainingSec % 60).padStart(2, '0')}s` 
                    : 'Your meal is freshly prepared and en route to your room!'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <span className="font-mono text-xs font-extrabold text-amber-950 bg-white border border-amber-300 px-3 py-1.5 rounded-xl shadow-2xs">
                {topOrderRemainingSec > 0 
                  ? `⏱️ ${Math.floor(topOrderRemainingSec / 60)}m ${String(topOrderRemainingSec % 60).padStart(2, '0')}s` 
                  : 'Ready Now'}
              </span>
              <span className="text-xs font-bold text-amber-800 flex items-center group-hover:translate-x-0.5 transition-transform">
                <span>View</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-stone-200 shadow-xs overflow-x-auto space-x-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('dining')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'dining'
                ? 'bg-slate-900 text-amber-200 shadow-md shadow-slate-900/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Room Dining</span>
          </button>
          
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'expenses'
                ? 'bg-slate-900 text-amber-200 shadow-md shadow-slate-900/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Room Bill</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'services'
                ? 'bg-slate-900 text-amber-200 shadow-md shadow-slate-900/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Guest Services</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'tracker'
                ? 'bg-slate-900 text-amber-200 shadow-md shadow-slate-900/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Order Tracker</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: IN-ROOM DINING (LIGHT LUXURY MENU)                         */}
        {/* ================================================================= */}
        {activeTab === 'dining' && (
          <div className="space-y-4">
            {/* Category Filter Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap shadow-2xs ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-stone-200 text-slate-600 hover:bg-stone-50'
                }`}
              >
                All Dishes ({allMenuItems.length})
              </button>
              {Object.keys(menuCategories).map(catName => (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap shadow-2xs ${
                    selectedCategory === catName
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-stone-200 text-slate-600 hover:bg-stone-50'
                  }`}
                >
                  {catName}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedItems.map((item: any) => {
                const cartEntry = cart.find(c => c.menuItemId === item._id);
                return (
                  <div 
                    key={item._id}
                    className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif font-bold text-slate-900 text-base">{item.name}</h3>
                        <span className="font-mono text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                          ETB {item.price?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
                      
                      {item.dietaryTags && item.dietaryTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {item.dietaryTags.map((tag: string) => (
                            <span key={tag} className="text-[10px] font-semibold bg-stone-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        ⏱️ ~{item.preparationTimeMinutes || 20} mins prep
                      </span>

                      {cartEntry ? (
                        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-300 rounded-xl px-2 py-1 text-amber-900">
                          <button 
                            onClick={() => updateCartQty(item._id, -1)}
                            className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-xs px-1">{cartEntry.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(item._id, 1)}
                            className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add to Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {displayedItems.length === 0 && (
              <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-2xl border border-stone-200">
                No items found in this section.
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: LIVE BILL & FOLIO STATEMENT                                */}
        {/* ================================================================= */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {loadingFolio ? (
              <div className="py-20 text-center text-xs text-slate-500">
                Synchronizing live room folio and charges...
              </div>
            ) : folioData ? (
              <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
                
                {/* Folio Summary Card */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Folio ID</span>
                      <span className="font-mono text-xs font-bold text-slate-700">{folioData.folioNumber}</span>
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">Itemized Room Bill</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Charges from room nights, restaurant dining, and services are aggregated here.
                    </p>
                  </div>

                  <div className="text-left sm:text-right bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Balance Due</span>
                    <span className="font-mono text-2xl font-black text-slate-900">
                      ETB {folioData.balance?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5 font-semibold">
                      Account Status: {folioData.status}
                    </span>
                  </div>
                </div>

                {/* Itemized Charges Table */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-700" />
                    <span>Itemized Transactions ({folioData.items?.length || 0})</span>
                  </h3>

                  <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 text-xs bg-white">
                    {folioData.items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-stone-50/70 transition-colors">
                        <div>
                          <span className="font-bold text-slate-900 block">{item.description}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(item.date).toLocaleDateString()} • {item.category} • Qty {item.quantity} @ ETB {item.unitPrice}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">ETB {item.total?.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400">incl. tax & service</span>
                        </div>
                      </div>
                    ))}

                    {(!folioData.items || folioData.items.length === 0) && (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        No transactions recorded on this room folio yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax & Breakdown Summary */}
                <div className="bg-stone-50 rounded-2xl p-4 space-y-2 text-xs text-slate-700 border border-stone-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Net:</span>
                    <span className="font-mono font-bold text-slate-900">ETB {folioData.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ethiopian VAT (15%):</span>
                    <span className="font-mono text-slate-800">ETB {folioData.taxTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hotel Service Charge (10%):</span>
                    <span className="font-mono text-slate-800">ETB {folioData.serviceChargeTotal?.toLocaleString()}</span>
                  </div>
                  {folioData.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Promotional Discount:</span>
                      <span className="font-mono font-bold">-ETB {folioData.discountTotal?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Payments Already Received:</span>
                    <span className="font-mono font-semibold text-emerald-700">-ETB {folioData.paidTotal?.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Outstanding Folio Balance:</span>
                    <span className="font-mono text-amber-900">ETB {folioData.balance?.toLocaleString()}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-3xl border border-stone-200">
                No active folio details found.
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: SMART IN-ROOM SERVICE REQUESTS                             */}
        {/* ================================================================= */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">In-Room Guest Services</h2>
              <p className="text-xs text-slate-500 mt-1">
                Tap any amenity or request below to dispatch hotel staff directly to your room.
              </p>
            </div>

            {/* Quick 1-Tap Request Tiles */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Housekeeping & Linens
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => handleQuickServiceRequest('HOUSEKEEPING', 'Extra Fresh Bath Towels & Slippers')}
                  disabled={submittingService}
                  className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">🧺</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 block">Extra Towels</span>
                  <span className="text-[10px] text-slate-500">Fresh bath towels & mat</span>
                </button>

                <button
                  onClick={() => handleQuickServiceRequest('HOUSEKEEPING', 'Extra Feather Pillows & Duvet')}
                  disabled={submittingService}
                  className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">🛏️</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 block">Extra Pillows</span>
                  <span className="text-[10px] text-slate-500">Feather / Hypoallergenic</span>
                </button>

                <button
                  onClick={() => handleQuickServiceRequest('HOUSEKEEPING', 'Clean & Make Up Room Now')}
                  disabled={submittingService}
                  className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">🧹</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 block">Room Cleaning</span>
                  <span className="text-[10px] text-slate-500">Make up bed & refresh</span>
                </button>

                <button
                  onClick={() => handleQuickServiceRequest('HOUSEKEEPING', 'Luxury Toiletries & Soap Replenishment')}
                  disabled={submittingService}
                  className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">🧴</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 block">Toiletries Refill</span>
                  <span className="text-[10px] text-slate-500">Shampoo, body wash, dental</span>
                </button>
              </div>
            </div>

            {/* Concierge & Maintenance Quick Tiles */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Concierge & Room Maintenance
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => handleQuickServiceRequest('MAINTENANCE', 'AC / Room Climate Control Assistance')}
                  disabled={submittingService}
                  className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">❄️</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 block">AC / Climate</span>
                  <span className="text-[10px] text-slate-500">Thermostat adjustment</span>
                </button>

                <button
                  onClick={() => handleQuickServiceRequest('CONCIERGE', 'Luggage Assistance & Bellhop Pick-up')}
                  disabled={submittingService}
                  className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">🧳</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 block">Luggage Pickup</span>
                  <span className="text-[10px] text-slate-500">Bellhop assistance</span>
                </button>

                <button
                  onClick={() => handleQuickServiceRequest('CONCIERGE', 'Morning Wake-Up Call Request (07:00 AM)')}
                  disabled={submittingService}
                  className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">⏰</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 block">Wake-Up Call</span>
                  <span className="text-[10px] text-slate-500">Scheduled phone reminder</span>
                </button>

                <button
                  onClick={() => handleQuickServiceRequest('EXPRESS_CHECKOUT', 'Express Check-Out Preparation')}
                  disabled={submittingService}
                  className="bg-white border border-stone-200 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">⚡</span>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 block">Express Departure</span>
                  <span className="text-[10px] text-slate-500">Pre-close room charges</span>
                </button>

                <button
                  onClick={() => setDayFinishedModalOpen(true)}
                  className="bg-indigo-50/50 border border-indigo-200 hover:border-indigo-400 rounded-2xl p-4 text-left transition-all shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-2xl mb-1.5 block">🌙</span>
                  <span className="font-bold text-xs text-indigo-950 group-hover:text-indigo-800 block">Day Finished</span>
                  <span className="text-[10px] text-indigo-700/80">Sleep mode & front desk alert</span>
                </button>
              </div>
            </div>

            {/* Custom Request Form */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                Custom In-Room Request
              </h3>
              <form onSubmit={handleCustomServiceRequest} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={customRequestCat}
                    onChange={(e: any) => setCustomRequestCat(e.target.value)}
                    className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="CONCIERGE">Concierge</option>
                  </select>
                  <input
                    type="text"
                    value={customRequestText}
                    onChange={(e) => setCustomRequestText(e.target.value)}
                    placeholder="Describe what you need brought to your room..."
                    className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                  />
                  <button
                    type="submit"
                    disabled={submittingService || !customRequestText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                  >
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: LIVE ACTIVITY & ORDER STATUS TRACKER                       */}
        {/* ================================================================= */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Live Orders & Service Updates</h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time preparation and delivery timeline for your room.
              </p>
            </div>

            {loadingActivity ? (
              <div className="py-20 text-center text-xs text-slate-500">
                Fetching active kitchen and service updates...
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Kitchen / Dining Orders */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-700" />
                    <span>In-Room Dining Orders ({activityOrders.length})</span>
                  </h3>

                  <div className="space-y-2.5">
                    {activityOrders.map((order: any) => {
                      const getStatusBadge = (st: string) => {
                        switch (st) {
                          case 'NEW':
                            return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Kitchen Received</span>;
                          case 'PREPARING':
                            return <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Chef Cooking</span>;
                          case 'READY':
                            return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">En Route to Room</span>;
                          case 'SERVED':
                          case 'PAID':
                            return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Delivered</span>;
                          default:
                            return <span className="bg-stone-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{st}</span>;
                        }
                      };

                      return (
                        <div key={order._id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{order.orderNumber}</span>
                            {getStatusBadge(order.status)}
                          </div>

                          {/* Live Kitchen Prep Timer Display */}
                          {order.estimatedReadyAt && (order.status === 'PREPARING' || order.status === 'READY' || order.status === 'NEW') && (() => {
                            const rem = Math.max(0, Math.floor((new Date(order.estimatedReadyAt).getTime() - now) / 1000));
                            return rem > 0 ? (
                              <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 my-2 flex items-center justify-between shadow-2xs">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-amber-200/70 flex items-center justify-center text-amber-900">
                                    <Timer className="w-4 h-4 animate-spin" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block">Kitchen Preparation Countdown</span>
                                    <span className="text-xs text-amber-950 font-medium">Estimated ready & delivered in:</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono text-sm font-extrabold text-amber-950 bg-white border border-amber-300 px-3 py-1 rounded-lg shadow-2xs inline-block">
                                    ⏱️ {Math.floor(rem / 60)}m {String(rem % 60).padStart(2, '0')}s
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 my-2 flex items-center space-x-2.5 text-emerald-900">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="text-xs font-bold block">Order Prepared & Ready!</span>
                                  <span className="text-[11px] text-emerald-700">Staff is en route to Room {room?.roomNumber || initialRoom}.</span>
                                </div>
                              </div>
                            );
                          })()}
                          
                          <div className="divide-y divide-stone-100 text-xs text-slate-700 my-2">
                            {order.items?.map((it: any, idx: number) => (
                              <div key={idx} className="py-1.5 flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-slate-900">{it.quantity}x {it.name}</span>
                                  {it.preparationTimeMinutes && (
                                    <span className="ml-2 text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      ~{it.preparationTimeMinutes}m prep
                                    </span>
                                  )}
                                  {it.specialInstructions && (
                                    <span className="block text-[10px] text-amber-800/80 italic">{it.specialInstructions}</span>
                                  )}
                                </div>
                                <span className="font-mono text-slate-500">ETB {it.subtotal}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Billed to Room Folio:</span>
                            <span className="font-mono font-bold text-slate-900">ETB {order.total}</span>
                          </div>
                        </div>
                      );
                    })}

                    {activityOrders.length === 0 && (
                      <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center text-slate-500 text-xs">
                        No food or beverage orders placed yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Requests */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Housekeeping & Concierge Requests ({activityRequests.length})</span>
                  </h3>

                  <div className="space-y-3">
                    {activityRequests.map((req: any) => {
                      const isCompleted = req.status === 'COMPLETED';
                      const isInProgress = req.status === 'IN_PROGRESS';
                      const isDayFinished = req.category === 'DAY_FINISHED';

                      return (
                        <div 
                          key={req._id} 
                          className={`bg-white rounded-2xl p-4.5 border transition-all shadow-xs ${
                            isCompleted
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : isInProgress
                              ? 'border-blue-300 bg-blue-50/20 ring-1 ring-blue-100'
                              : isDayFinished
                              ? 'border-indigo-200 bg-indigo-50/20'
                              : 'border-amber-200 bg-amber-50/20'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] text-slate-400 block font-semibold">{req.requestNumber}</span>
                              {isDayFinished && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center space-x-1">
                                  <span>🌙</span>
                                  <span>Sleep Mode</span>
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <span className={`self-start sm:self-center px-3 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1.5 ${
                              isCompleted 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : isInProgress
                                ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                                : isDayFinished
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              <span>
                                {isCompleted 
                                  ? '✨ Completed & Room Serviced' 
                                  : isInProgress 
                                  ? '🧹 Housekeeper Active in Room'
                                  : isDayFinished 
                                  ? '🌙 Front Desk Notified'
                                  : '⏳ Request Received by Reception'}
                              </span>
                            </span>
                          </div>

                          <div className="pt-2">
                            <span className="font-bold text-slate-900 text-sm block">{req.item}</span>
                            {req.specialInstructions && req.specialInstructions !== 'None' && (
                              <span className="text-xs text-slate-600 block mt-1.5 font-mono bg-white px-2.5 py-1.5 rounded-xl border border-stone-200">
                                <strong>Your note:</strong> {req.specialInstructions}
                              </span>
                            )}

                            {/* Two-way status progress messaging */}
                            <div className="mt-2.5 pt-2 border-t border-stone-100 text-[11px]">
                              {isCompleted && (
                                <p className="text-emerald-800 font-medium flex items-center space-x-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Housekeeping has fulfilled this request and refreshed your room.</span>
                                </p>
                              )}
                              {isInProgress && (
                                <p className="text-blue-800 font-medium flex items-center space-x-1.5">
                                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 animate-spin" />
                                  <span>
                                    {req.assignedStaffName 
                                      ? `Staff member ${req.assignedStaffName} has been dispatched and is attending to your room.`
                                      : 'Housekeeping has been dispatched to your room.'}
                                  </span>
                                </p>
                              )}
                              {!isCompleted && !isInProgress && !isDayFinished && (
                                <p className="text-amber-800 font-medium flex items-center space-x-1.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Reception received your request and is dispatching housekeeping now.</span>
                                </p>
                              )}
                              {isDayFinished && (
                                <p className="text-indigo-800 font-medium flex items-center space-x-1.5">
                                  <span>🌙</span>
                                  <span>Night staff has logged your sleep mode. Rest well!</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {activityRequests.length === 0 && (
                      <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center text-slate-500 text-xs">
                        No active service requests for this room.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && activeTab === 'dining' && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-stone-200 p-4 backdrop-blur-md shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase text-slate-800">
                  {totalCartItems} {totalCartItems === 1 ? 'dish' : 'dishes'} selected
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-amber-900">
                Total: ETB {cartTotal.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Review Order</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Review Bottom Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-stone-200 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-amber-800" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">Room Service Order</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="py-4 overflow-y-auto space-y-3 flex-1">
              {cart.map(item => (
                <div key={item.menuItemId} className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{item.name}</span>
                    <span className="text-[11px] text-amber-900 font-mono font-medium">ETB {item.price} each</span>
                  </div>

                  <div className="flex items-center space-x-2 bg-white border border-stone-200 rounded-xl px-2 py-1 text-slate-800">
                    <button 
                      onClick={() => updateCartQty(item.menuItemId, -1)}
                      className="p-1 hover:bg-stone-100 rounded"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-xs px-1">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQty(item.menuItemId, 1)}
                      className="p-1 hover:bg-stone-100 rounded"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Special Delivery Notes */}
              <div className="mt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Special Kitchen Instructions
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Extra napkins, no spicy peppers, deliver promptly..."
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-slate-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-600 resize-none"
                />
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Dishes Subtotal:</span>
                  <span className="font-mono text-slate-900">ETB {cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>15% VAT:</span>
                  <span className="font-mono text-slate-900">ETB {cartTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>10% In-Room Service Fee:</span>
                  <span className="font-mono text-slate-900">ETB {cartService.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total (Charge to Room):</span>
                  <span className="font-mono text-amber-900">ETB {cartTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Order Confirmation Action */}
            <div className="pt-4 border-t border-stone-100">
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{placingOrder ? 'Sending to Kitchen...' : `Charge ETB ${cartTotal.toLocaleString()} to Room`}</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Wi-Fi Fast Connect QR Code Modal */}
      {wifiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-stone-200 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm">Guest Wi-Fi Auto-Connect</h3>
                  <span className="text-[10px] text-slate-500">Scan with camera to connect</span>
                </div>
              </div>
              <button 
                onClick={() => setWifiModalOpen(false)}
                className="p-1 rounded-xl hover:bg-stone-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center justify-center">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-200">
                <QRCodeSVG 
                  value={`WIFI:T:WPA;S:${hotelInfo?.wifiSsid || 'GrandView_Guest_5G'};P:${hotelInfo?.wifiPassword || 'WelcomeGrandView2026'};;`}
                  size={190}
                  level="M"
                />
              </div>
              <p className="text-[11px] text-slate-600 mt-3 font-medium px-2 leading-relaxed">
                Open your iPhone or Android camera app and point it at this QR code. Tap the pop-up notification to join Wi-Fi instantly without entering a password.
              </p>
            </div>

            <div className="bg-stone-100/80 p-3 rounded-2xl text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Network (SSID):</span>
                <span className="font-mono font-bold text-slate-900">{hotelInfo?.wifiSsid || 'GrandView_Guest_5G'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Password:</span>
                <span className="font-mono font-bold text-amber-900">{hotelInfo?.wifiPassword || 'WelcomeGrandView2026'}</span>
              </div>
            </div>

            <button
              onClick={() => setWifiModalOpen(false)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Day Finished & Good Night Modal */}
      {dayFinishedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-stone-200 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-base sm:text-lg">Finish Day & Good Night</h3>
                  <p className="text-[11px] text-slate-500">Notify Reception and configure your quiet hours</p>
                </div>
              </div>
              <button 
                onClick={() => setDayFinishedModalOpen(false)}
                className="p-1 rounded-xl hover:bg-stone-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePlaceDayFinished} className="py-4 overflow-y-auto space-y-4 flex-1 pr-1">
              
              {/* Option 1: Do Not Disturb Auto-Toggle */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <BellOff className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Activate Do Not Disturb</span>
                    <span className="text-[10px] text-slate-500">Staff will respect quiet hours and not knock</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nightDndEnabled}
                    onChange={(e) => setNightDndEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>

              {/* Option 2: Morning Wake-Up Call */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Morning Wake-Up Call
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select a preferred time for front desk to place a courtesy room call.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', 'CUSTOM', 'NONE'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNightWakeUpTime(t)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                        nightWakeUpTime === t
                          ? 'bg-slate-900 text-amber-200 shadow-xs'
                          : 'bg-white border border-stone-200 text-slate-700 hover:bg-stone-100'
                      }`}
                    >
                      {t === 'NONE' ? 'No Call' : (t === 'CUSTOM' ? 'Custom' : t)}
                    </button>
                  ))}
                </div>

                {nightWakeUpTime === 'CUSTOM' && (
                  <div className="pt-2">
                    <input
                      type="text"
                      value={customWakeUpInput}
                      onChange={(e) => setCustomWakeUpInput(e.target.value)}
                      placeholder="e.g. 05:45 AM or 09:15 AM"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                )}
              </div>

              {/* Option 3: Evening Turndown & Fresh Water */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Evening Turndown & Extra Mineral Water</span>
                    <span className="text-[10px] text-slate-500">Dispatch housekeeping to freshen linens & deliver bottled water</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nightTurndown}
                    onChange={(e) => setNightTurndown(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
                </label>
              </div>

              {/* Option 4: Tomorrow Breakfast Preference */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Coffee className="w-4 h-4 text-amber-700" />
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Tomorrow's Breakfast Arrangement
                  </label>
                </div>
                <div className="space-y-1.5 pt-1">
                  {[
                    { id: 'RESTAURANT_BUFFET', label: 'Restaurant Buffet (Ground Floor • 06:30 - 10:30 AM)' },
                    { id: 'ROOM_SERVICE', label: 'In-Room Breakfast Delivery (Staff will contact in AM)' },
                    { id: 'NONE', label: 'No Breakfast Needed / Early Departure' }
                  ].map((opt) => (
                    <label key={opt.id} className="flex items-center space-x-2.5 p-2 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-stone-50">
                      <input
                        type="radio"
                        name="nightBreakfast"
                        value={opt.id}
                        checked={nightBreakfastPref === opt.id}
                        onChange={() => setNightBreakfastPref(opt.id)}
                        className="text-slate-900 focus:ring-amber-500"
                      />
                      <span className="text-xs text-slate-800 font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Option 5: Special Night Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Notes for Reception / Front Desk (Optional)
                </label>
                <textarea
                  value={nightSpecialNotes}
                  onChange={(e) => setNightSpecialNotes(e.target.value)}
                  placeholder="e.g. Need extra soft pillows, please ensure quiet hallway, or taxi needed tomorrow..."
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-slate-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-600 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingDayFinished}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Moon className="w-4 h-4 text-amber-400" />
                  <span>{submittingDayFinished ? 'Submitting & Notifying Reception...' : 'Confirm & Finish Day'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
