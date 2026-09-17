import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ConciergeBell, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Plus, 
  User, 
  Calendar, 
  Key, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  MoveRight,
  Sparkles,
  ArrowRight,
  QrCode,
  Moon,
  Send,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
  ShieldAlert
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { InRoomTentCardModal } from '../../components/pms/InRoomTentCardModal';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const PmsFrontDeskPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();

  const [floors, setFloors] = useState<Record<number, any[]>>({});
  const [statusCounts, setStatusCounts] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [checkInModalOpen, setCheckInModalOpen] = useState<boolean>(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState<boolean>(false);
  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);
  const [walkInModalOpen, setWalkInModalOpen] = useState<boolean>(false);
  const [tentCardModalOpen, setTentCardModalOpen] = useState<boolean>(false);
  const [tentCardRoomNumber, setTentCardRoomNumber] = useState<string>('');

  // Guest Requests & Dispatch state
  const [guestRequests, setGuestRequests] = useState<any[]>([]);
  const [dispatchModalOpen, setDispatchModalOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [dispatchPriority, setDispatchPriority] = useState<string>('HIGH');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [dispatching, setDispatching] = useState<boolean>(false);

  // Ribbons collapsible state
  const [showArrivalsRibbon, setShowArrivalsRibbon] = useState<boolean>(true);
  const [showRequestsRibbon, setShowRequestsRibbon] = useState<boolean>(true);

  // Selected item state for actions
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [activeStay, setActiveStay] = useState<any | null>(null);
  const [activeReservation, setActiveReservation] = useState<any | null>(null);

  // Check-in form
  const [keyCards, setKeyCards] = useState<number>(1);
  const [pendingArrivals, setPendingArrivals] = useState<any[]>([]);

  // Check-out form
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<string>('CASH');
  const [checkoutSummary, setCheckoutSummary] = useState<any>(null);
  const [loadingCheckoutSummary, setLoadingCheckoutSummary] = useState<boolean>(false);

  // Transfer form
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Guest request');
  const [availableRoomsForTransfer, setAvailableRoomsForTransfer] = useState<any[]>([]);

  // Walk-in form
  const [walkInRoomId, setWalkInRoomId] = useState<string>('');
  const [walkInNights, setWalkInNights] = useState<number>(1);
  const [walkInGuest, setWalkInGuest] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    nationality: 'Ethiopian'
  });
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<string>('CASH');
  const [walkInPaidAmount, setWalkInPaidAmount] = useState<string>('0');

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/auth/staff');
      const list = res.data?.data?.staff || res.data?.staff || (Array.isArray(res.data) ? res.data : []);
      setStaffList(list);
    } catch (e) {
      console.error('Failed to load staff list', e);
      setStaffList([]);
    }
  };

  const fetchFrontDeskBoard = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.get('/pms/frontdesk/board');
      setFloors(res.data.floors || {});
      setStatusCounts(res.data.statusCounts || {});
      setPendingArrivals(res.data.todayArrivals || []);
      setGuestRequests(res.data.guestRequests || []);
    } catch (e) {
      console.error('Failed to fetch front desk board', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrontDeskBoard();
    fetchStaffList();
    // Auto-refresh every 10 seconds to reflect online bookings and guest requests instantly
    const interval = setInterval(() => {
      fetchFrontDeskBoard(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Open Dispatch Modal for In-Room Request
  const openDispatchModal = (reqItem: any) => {
    setSelectedRequest(reqItem);
    setSelectedStaffId(reqItem.assignedStaff?._id || reqItem.assignedStaff || '');
    setDispatchPriority(reqItem.priority || 'HIGH');
    setDispatchNotes(reqItem.specialInstructions || '');
    setDispatchModalOpen(true);
    if (staffList.length === 0) {
      fetchStaffList();
    }
  };

  // Submit Dispatch to Housekeeping
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setDispatching(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post(`/pms/frontdesk/service-requests/${selectedRequest._id}/dispatch-housekeeping`, {
        staffId: selectedStaffId || undefined,
        priority: dispatchPriority,
        notes: dispatchNotes
      });
      setActionSuccess(res.data.message || 'Dispatched to Housekeeping successfully.');
      setDispatchModalOpen(false);
      fetchFrontDeskBoard();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to dispatch to housekeeping.');
    } finally {
      setDispatching(false);
    }
  };

  // Directly complete request from reception
  const handleDirectCompleteRequest = async (reqItem: any) => {
    try {
      await api.patch(`/pms/frontdesk/service-requests/${reqItem._id}/status`, {
        status: 'COMPLETED'
      });
      setActionSuccess(`Request for Room ${reqItem.room?.roomNumber || ''} marked completed.`);
      fetchFrontDeskBoard();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to update request.');
    }
  };

  // Quick check in for arrival card
  const handleArrivalCheckInClick = (resItem: any) => {
    setActiveReservation(resItem);
    setActiveRoom(resItem.assignedRoom || null);
    setKeyCards(1);
    setCheckInModalOpen(true);
  };

  // Handle URL actions (e.g. ?action=walkin or ?checkin=resId)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'walkin') {
      setWalkInModalOpen(true);
    }
  }, [searchParams]);

  // Execute Check-in
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.post('/pms/frontdesk/check-in', {
        reservationId: activeReservation?._id,
        roomId: activeRoom?._id || activeReservation?.assignedRoom?._id,
        keyCardsIssued: keyCards
      });
      setActionSuccess(res.data.message);
      setCheckInModalOpen(false);
      fetchFrontDeskBoard();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Check-in failed.');
    }
  };

  // Execute Check-out
  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.post('/pms/frontdesk/check-out', {
        stayId: activeStay?._id,
        paymentMethod: checkoutPaymentMethod,
        paidAmount: Number(paidAmount) || 0
      });
      setActionSuccess(res.data.message);
      setCheckOutModalOpen(false);
      fetchFrontDeskBoard();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Check-out failed.');
    }
  };

  // Open Check-Out Modal with live itemized folio & services calculation
  const openCheckOutModal = async (room: any) => {
    setActiveRoom(room);
    setActiveStay(room.currentStay);
    setPaidAmount('0');
    setCheckoutSummary(null);
    setCheckOutModalOpen(true);

    if (room.currentStay?._id) {
      try {
        setLoadingCheckoutSummary(true);
        const res = await api.get(`/pms/frontdesk/stay/${room.currentStay._id}/checkout-summary`);
        const data = res.data.data;
        setCheckoutSummary(data);
        const due = data.balanceDue !== undefined ? data.balanceDue : (data.folio?.balance || 0);
        setPaidAmount(due > 0 ? String(due) : '0');
      } catch (e) {
        console.error('Failed to load checkout summary', e);
        const fbBal = room.currentStay?.folio?.balance || 0;
        setPaidAmount(fbBal > 0 ? String(fbBal) : '0');
      } finally {
        setLoadingCheckoutSummary(false);
      }
    }
  };

  // Execute Room Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.post('/pms/frontdesk/transfer-room', {
        stayId: activeStay?._id,
        newRoomId: targetRoomId,
        reason: transferReason
      });
      setActionSuccess(res.data.message);
      setTransferModalOpen(false);
      fetchFrontDeskBoard();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Transfer failed.');
    }
  };

  // Execute Walk-in Reservation
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const now = new Date();
    const checkOut = new Date(now);
    checkOut.setDate(checkOut.getDate() + walkInNights);

    try {
      const res = await api.post('/pms/reservations/walk-in', {
        roomId: walkInRoomId,
        checkInDate: now.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
        adults: 1,
        guest: walkInGuest,
        paymentMethod: walkInPaymentMethod,
        paidAmount: Number(walkInPaidAmount) || 0
      });

      // Automatically check them into the stay
      await api.post('/pms/frontdesk/check-in', {
        reservationId: res.data.reservation._id,
        roomId: walkInRoomId,
        keyCardsIssued: 1
      });

      setActionSuccess(`Walk-in guest successfully registered and checked into Room!`);
      setWalkInModalOpen(false);
      fetchFrontDeskBoard();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Walk-in creation failed.');
    }
  };

  // Prepare Transfer modal
  const openTransferModal = (room: any) => {
    setActiveRoom(room);
    setActiveStay(room.currentStay);
    // Find all available rooms
    const freeRooms: any[] = [];
    Object.values(floors).flat().forEach((r: any) => {
      if (r._id !== room._id && r.status === 'AVAILABLE') {
        freeRooms.push(r);
      }
    });
    setAvailableRoomsForTransfer(freeRooms);
    if (freeRooms.length > 0) setTargetRoomId(freeRooms[0]._id);
    setTransferModalOpen(true);
  };

  // Filtered rooms
  const allRooms = Object.values(floors).flat();
  const filteredRooms = allRooms.filter((r) => {
    const matchFloor = selectedFloor === 'ALL' || r.floor === selectedFloor;
    const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    return matchFloor && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROLS & FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ConciergeBell className="w-5 h-5 text-gold-dark" />
            <h1 className="font-serif text-2xl font-bold text-slate-900">Front Desk Room Board</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status, real-time check-in, check-out, and room transfers across all floors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Walk-in Button */}
          <button
            onClick={() => setWalkInModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-gold" />
            <span>New Walk-in</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchFrontDeskBoard()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Board"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. STATUS FILTER BAR */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'DIRTY', 'MAINTENANCE'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
              selectedStatus === st
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Rooms' : st}
            {st !== 'ALL' && statusCounts[st] !== undefined && (
              <span className="ml-1.5 opacity-70">({statusCounts[st]})</span>
            )}
          </button>
        ))}

        <div className="h-5 w-px bg-slate-200 mx-2 hidden sm:block"></div>

        {/* Floor Filter */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">Floor:</span>
          {['ALL', 1, 2, 3, 4].map((fl) => (
            <button
              key={fl}
              onClick={() => setSelectedFloor(fl as any)}
              className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                selectedFloor === fl
                  ? 'bg-gold text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {fl === 'ALL' ? 'All' : fl}
            </button>
          ))}
        </div>
      </div>

      {/* 3. INTERACTIVE ROOM GRID */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading Front Desk Matrix...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const isOccupied = room.status === 'OCCUPIED';
            const isReserved = room.status === 'RESERVED';
            const isAvailable = room.status === 'AVAILABLE';
            const isDirty = room.cleanStatus === 'DIRTY';
            const isCleaning = room.status === 'CLEANING';
            const isMaintenance = room.status === 'MAINTENANCE';

            const guestName = room.currentStay?.guest?.fullName || room.currentReservation?.guest?.fullName;
            const resNumber = room.currentReservation?.bookingNumber;

            return (
              <div
                key={room._id}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isOccupied
                    ? 'border-blue-200 ring-1 ring-blue-100'
                    : isAvailable
                    ? 'border-emerald-200'
                    : isDirty
                    ? 'border-orange-200 bg-orange-50/20'
                    : isMaintenance
                    ? 'border-purple-200 bg-purple-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Bar: Room # & Status Badge */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-serif text-2xl font-bold text-slate-900 leading-tight">
                          {room.roomNumber}
                        </span>
                        <button
                          onClick={() => {
                            setTentCardRoomNumber(room.roomNumber);
                            setTentCardModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-gold transition-colors rounded hover:bg-slate-100"
                          title={`In-Room QR Stand & Passcode for Room ${room.roomNumber}`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Floor {room.floor} • {room.roomType?.name}
                      </span>
                    </div>
                    <StatusBadge status={room.status} />
                  </div>

                  {/* Clean Status Pill */}
                  <div className="flex items-center space-x-1.5 my-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        room.cleanStatus === 'CLEAN'
                          ? 'bg-emerald-50 text-emerald-700'
                          : room.cleanStatus === 'INSPECTED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700 font-bold'
                      }`}
                    >
                      {room.cleanStatus}
                    </span>
                    {room.notes && (
                      <span className="text-[10px] text-slate-500 truncate" title={room.notes}>
                        ⚠️ {room.notes}
                      </span>
                    )}
                  </div>

                  {/* Guest Info if Occupied or Reserved */}
                  {guestName ? (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1 my-3">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900 truncate">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{guestName}</span>
                      </div>
                      {resNumber && (
                        <div className="text-[10px] font-mono text-slate-500">
                          #{resNumber}
                        </div>
                      )}
                      {isOccupied && room.currentStay?.scheduledCheckOut && (
                        <div className="text-[10px] text-slate-400">
                          Depart: {new Date(room.currentStay.scheduledCheckOut).toLocaleDateString()}
                        </div>
                      )}

                      {/* Day Finished / Night Status Badge */}
                      {isOccupied && room.currentStay?.dayFinished && (
                        <div className="bg-indigo-950/5 border border-indigo-200/80 rounded-lg p-1.5 mt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-indigo-900 font-semibold">
                            <div className="flex items-center space-x-1">
                              <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Day Finished</span>
                            </div>
                            {room.currentStay?.wakeUpCallTime ? (
                              <span className="font-mono font-bold text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                                ⏰ {room.currentStay.wakeUpCallTime}
                              </span>
                            ) : (
                              <span className="text-[10px] text-indigo-500 font-medium">
                                Quiet Mode
                              </span>
                            )}
                          </div>
                          {(room.currentStay?.turndownRequested || room.currentStay?.breakfastPreference) && (
                            <div className="text-[10px] text-slate-500 border-t border-indigo-100 pt-0.5 flex flex-wrap gap-1">
                              {room.currentStay?.turndownRequested && (
                                <span className="bg-purple-50 text-purple-700 px-1 rounded">🛏️ Turndown</span>
                              )}
                              {room.currentStay?.breakfastPreference && (
                                <span className="bg-amber-50 text-amber-800 px-1 rounded truncate max-w-[140px]" title={room.currentStay.breakfastPreference}>
                                  🍳 Breakfast
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {isOccupied && room.currentStay?.doNotDisturb && !room.currentStay?.dayFinished && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-rose-700 mt-1 flex items-center space-x-1">
                          <span>🔕 Do Not Disturb Active</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xs text-slate-400 italic">
                      Vacant Room
                    </div>
                  )}
                </div>

                {/* Bottom Operational Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  {isAvailable && (
                    <button
                      onClick={() => {
                        setWalkInRoomId(room._id);
                        setWalkInModalOpen(true);
                      }}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                    >
                      Quick Walk-in
                    </button>
                  )}

                  {isReserved && (
                    <button
                      onClick={() => {
                        setActiveRoom(room);
                        setActiveReservation(room.currentReservation);
                        setCheckInModalOpen(true);
                      }}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs flex items-center justify-center space-x-1"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Check-In</span>
                    </button>
                  )}

                  {isOccupied && (
                    <div className="w-full space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => openTransferModal(room)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors text-center"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => openCheckOutModal(room)}
                          className="bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-2xs text-center"
                        >
                          Check-Out
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setTentCardRoomNumber(room.roomNumber);
                          setTentCardModalOpen(true);
                        }}
                        className="w-full bg-gold-50 hover:bg-gold-100 text-gold-dark border border-gold/40 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                        title="View In-Room QR Stand & Passcode"
                      >
                        <QrCode className="w-3.5 h-3.5 text-gold-dark" />
                        <span>In-Room QR & Passcode</span>
                      </button>
                    </div>
                  )}

                  {(isDirty || isCleaning) && (
                    <button
                      onClick={async () => {
                        await api.patch(`/pms/rooms/${room._id}/status`, {
                          status: 'AVAILABLE',
                          cleanStatus: 'CLEAN'
                        });
                        fetchFrontDeskBoard();
                      }}
                      className="w-full bg-cyan-700 hover:bg-cyan-800 text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs flex items-center justify-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mark Ready</span>
                    </button>
                  )}

                  {isMaintenance && (
                    <button
                      onClick={() => navigate('/pms/maintenance')}
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                    >
                      View Ticket
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CHECK-IN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        title={`Guest Check-in: ${activeRoom?.roomNumber ? `Room ${activeRoom.roomNumber}` : 'Assign & Check-in'}`}
        subtitle={`Booking #${activeReservation?.bookingNumber || 'DIRECT'}`}
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <p><strong>Guest:</strong> {activeReservation?.guest?.fullName || (activeReservation?.guest?.firstName ? `${activeReservation.guest.firstName} ${activeReservation.guest.lastName || ''}` : 'Guest')}</p>
            <p><strong>Room:</strong> {activeRoom ? `Room ${activeRoom.roomNumber} (${activeRoom.roomType?.name || ''})` : (activeReservation?.assignedRoom?.roomNumber ? `Room ${activeReservation.assignedRoom.roomNumber}` : 'Please select room below')}</p>
            <p><strong>Check-out:</strong> {activeReservation?.checkOutDate ? new Date(activeReservation.checkOutDate).toLocaleDateString() : 'N/A'}</p>
          </div>

          {!activeRoom && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Available Room *
              </label>
              <select
                required
                value={targetRoomId}
                onChange={(e) => {
                  setTargetRoomId(e.target.value);
                  const found = allRooms.find((r) => r._id === e.target.value);
                  if (found) setActiveRoom(found);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Choose Available Room --</option>
                {allRooms
                  .filter((r) => r.status === 'AVAILABLE')
                  .map((r) => (
                    <option key={r._id} value={r._id}>
                      Room {r.roomNumber} ({r.roomType?.name || 'Standard'})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keycards Issued
            </label>
            <input
              type="number"
              min={1}
              max={4}
              value={keyCards}
              onChange={(e) => setKeyCards(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCheckInModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Confirm Check-in
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: CHECK-OUT WITH ITEMIZED SERVICE SETTLEMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={checkOutModalOpen}
        onClose={() => setCheckOutModalOpen(false)}
        title={`Check-out & Services Settlement: Room ${activeRoom?.roomNumber}`}
        subtitle={`Guest: ${activeStay?.guest?.fullName || activeStay?.guest?.name || 'In-House Guest'}`}
      >
        <form onSubmit={handleCheckOutSubmit} className="space-y-4">
          {loadingCheckoutSummary ? (
            <div className="py-8 text-center text-xs text-slate-500 font-medium space-y-2">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Calculating folio balance, room nights & in-room services taken...</p>
            </div>
          ) : (
            <>
              {/* Itemized Services & Room Charges Table */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">
                    Services & Incurred Charges
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    Folio #{checkoutSummary?.folio?.folioNumber || activeStay?.folio?.folioNumber || 'ACTIVE'}
                  </span>
                </div>

                {/* Items list */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
                  {(checkoutSummary?.folio?.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-start gap-2">
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs">{it.description}</span>
                        <span className="text-[10px] text-slate-400">
                          {it.category} • Qty {it.quantity} @ ETB {it.unitPrice}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        ETB {it.total?.toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {(!checkoutSummary?.folio?.items || checkoutSummary.folio.items.length === 0) && (
                    <div className="py-2 text-center text-slate-400 italic">
                      Standard room stay charges
                    </div>
                  )}
                </div>

                {/* Financial Totals Breakdown */}
                <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-800">
                      ETB {(checkoutSummary?.folio?.subtotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%) + Service Charge (10%):</span>
                    <span className="font-mono text-slate-800">
                      ETB {((checkoutSummary?.folio?.taxTotal || 0) + (checkoutSummary?.folio?.serviceChargeTotal || 0)).toLocaleString()}
                    </span>
                  </div>
                  {(checkoutSummary?.folio?.paidTotal || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Deposits / Payments Settled:</span>
                      <span className="font-mono">
                        -ETB {(checkoutSummary?.folio?.paidTotal || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-slate-900 font-bold text-sm">
                    <span>Total Balance Due to Settle:</span>
                    <span className="font-mono text-amber-900 text-base">
                      ETB {(checkoutSummary?.balanceDue !== undefined ? checkoutSummary.balanceDue : (activeStay?.folio?.balance || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Check-out will settle the room folio, release the room, mark Room {activeRoom?.roomNumber} as <strong>DIRTY</strong>, and automatically queue a departure clean for Housekeeping.
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Settle Services & Balance (ETB)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const due = checkoutSummary?.balanceDue !== undefined ? checkoutSummary.balanceDue : (activeStay?.folio?.balance || 0);
                      setPaidAmount(String(due));
                    }}
                    className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline"
                  >
                    Pay Full Balance
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={checkoutPaymentMethod}
                  onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <option value="CASH">Cash (Front Desk)</option>
                  <option value="CREDIT_CARD">Credit / Debit Card (POS)</option>
                  <option value="TELEBIRR">Telebirr Mobile Payment</option>
                  <option value="CHAPA">Chapa Payment Gateway</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                </select>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCheckOutModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingCheckoutSummary}
              className="bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-400/40 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs disabled:opacity-50 transition-all"
            >
              Settle ETB {Number(paidAmount || 0).toLocaleString()} & Check-Out
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ROOM TRANSFER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={`Transfer Guest from Room ${activeRoom?.roomNumber}`}
        subtitle={`Guest: ${activeStay?.guest?.fullName}`}
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Destination Room (Available Only)
            </label>
            <select
              required
              value={targetRoomId}
              onChange={(e) => setTargetRoomId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {availableRoomsForTransfer.map((r) => (
                <option key={r._id} value={r._id}>
                  Room {r.roomNumber} (Floor {r.floor} • {r.roomType?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Transfer Reason
            </label>
            <input
              type="text"
              required
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Guest requested higher floor"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: NEW WALK-IN RESERVATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        title="Register Front Desk Walk-In Guest"
        subtitle="Immediate room reservation and keycard check-in"
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Available Room *
            </label>
            <select
              required
              value={walkInRoomId}
              onChange={(e) => setWalkInRoomId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Choose available room --</option>
              {allRooms
                .filter((r) => r.status === 'AVAILABLE')
                .map((r) => (
                  <option key={r._id} value={r._id}>
                    Room {r.roomNumber} ({r.roomType?.name} - ETB {r.roomType?.basePrice}/night)
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={walkInGuest.firstName}
                onChange={(e) => setWalkInGuest({ ...walkInGuest, firstName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={walkInGuest.lastName}
                onChange={(e) => setWalkInGuest({ ...walkInGuest, lastName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={walkInGuest.phone}
                onChange={(e) => setWalkInGuest({ ...walkInGuest, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Number of Nights
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={walkInNights}
                onChange={(e) => setWalkInNights(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={walkInPaymentMethod}
                onChange={(e) => setWalkInPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="TELEBIRR">Telebirr</option>
                <option value="CHAPA">Chapa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Deposit / Paid Amount (ETB)
              </label>
              <input
                type="number"
                value={walkInPaidAmount}
                onChange={(e) => setWalkInPaidAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setWalkInModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Register & Check-in
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: DISPATCH GUEST REQUEST TO HOUSEKEEPING                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title={`Dispatch In-Room Request: Room ${selectedRequest?.room?.roomNumber || ''}`}
        subtitle={`Request #${selectedRequest?.requestNumber || selectedRequest?._id?.slice(-6) || ''} • ${selectedRequest?.category || 'SERVICE'}`}
      >
        <form onSubmit={handleDispatchSubmit} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Guest Request</span>
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold text-[10px]">
                {selectedRequest?.category || 'HOUSEKEEPING'}
              </span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{selectedRequest?.item}</p>
            {selectedRequest?.specialInstructions && (
              <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                <strong>Guest Notes:</strong> {selectedRequest.specialInstructions}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assign Housekeeper / Staff
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
            >
              <option value="">-- General Pool (Any available Housekeeper) --</option>
              {(Array.isArray(staffList) ? staffList : []).map((st: any) => (
                <option key={st._id} value={st._id}>
                  {st.fullName || st.name} ({st.role || st.department || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Priority
            </label>
            <select
              value={dispatchPriority}
              onChange={(e) => setDispatchPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
            >
              <option value="NORMAL">Normal Priority</option>
              <option value="HIGH">High Priority (Within 15 mins)</option>
              <option value="URGENT">Urgent / Immediate Attention</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Dispatch Instructions / Notes for Housekeeper
            </label>
            <textarea
              rows={2}
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="e.g. Guest is waiting in room, provide extra fresh towels and clean linens..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:border-amber-600 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setDispatchModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={dispatching}
              className="bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-gold" />
              <span>{dispatching ? 'Dispatching...' : 'Dispatch to Housekeeper'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* In-Room QR Table Tent Card Modal */}
      <InRoomTentCardModal
        isOpen={tentCardModalOpen}
        onClose={() => setTentCardModalOpen(false)}
        roomNumber={tentCardRoomNumber}
      />
    </div>
  );
};
