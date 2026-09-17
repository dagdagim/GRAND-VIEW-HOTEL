import React, { useState, useEffect, useMemo } from 'react';
import { 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Bed, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Receipt,
  Timer,
  Eye,
  Layers,
  Table,
  Check
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const PmsRestaurantPage: React.FC = () => {
  const { formatPrice } = useCurrency();

  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Category filter
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');

  // Active Order Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'ROOM_SERVICE' | 'TAKEAWAY'>('DINE_IN');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Charge to Room Modal State
  const [chargeRoomModalOpen, setChargeRoomModalOpen] = useState<boolean>(false);
  const [chargeRoomNumber, setChargeRoomNumber] = useState<string>('103');
  const [inHouseRooms, setInHouseRooms] = useState<any[]>([]);
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState<string | null>(null);

  // View Mode: Group by Room vs Flat Table
  const [ordersViewMode, setOrdersViewMode] = useState<'ROOM_GROUPED' | 'TABLE'>('ROOM_GROUPED');

  // Order Details & Per-Item Food Timer Modal State
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);
  const [itemTimersState, setItemTimersState] = useState<{ [index: number]: number }>({});
  const [customTotalMinutes, setCustomTotalMinutes] = useState<number>(20);

  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Live timer tick trigger
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timerInterval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timerInterval);
  }, []);

  const fetchCatalogAndOrders = async () => {
    setLoading(true);
    try {
      const [catRes, ordRes, boardRes] = await Promise.all([
        api.get('/pms/restaurant/catalog'),
        api.get('/pms/restaurant/orders'),
        api.get('/pms/frontdesk/board')
      ]);

      setCategories(catRes.data.categories || []);
      setMenuItems(catRes.data.items || []);
      setTables(catRes.data.tables || []);
      setOrders(ordRes.data.orders || []);

      // Extract occupied rooms with active stays
      const occRooms: any[] = [];
      Object.values(boardRes.data.floors || {}).flat().forEach((r: any) => {
        if (r.status === 'OCCUPIED' && r.currentStay?.guest) {
          occRooms.push(r);
        }
      });
      setInHouseRooms(occRooms);
      if (occRooms.length > 0) {
        setChargeRoomNumber(occRooms[0].roomNumber);
      }
    } catch (e) {
      console.error('Failed to load restaurant POS', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogAndOrders();
  }, []);

  // Cart operations
  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === itemId) {
            const q = i.quantity + delta;
            return q > 0 ? { ...i, quantity: q } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== itemId));
  };

  // Calculations
  const cartSubtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.15 * 100) / 100;
  const cartServiceCharge = Math.round(cartSubtotal * 0.10 * 100) / 100;
  const cartTotal = cartSubtotal + cartTax + cartServiceCharge;

  // Create standard order
  const handlePlaceOrder = async (isRoomCharge = false) => {
    if (cart.length === 0) return;
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await api.post('/pms/restaurant/orders', {
        tableId: orderType === 'DINE_IN' ? selectedTableId || undefined : undefined,
        orderType,
        items: cart,
        notes: orderNotes
      });

      const order = res.data.order;

      if (isRoomCharge) {
        setLastCreatedOrderId(order._id);
        setChargeRoomModalOpen(true);
      } else {
        setFeedbackSuccess(`Order #${order.orderNumber} created successfully!`);
        setCart([]);
        fetchCatalogAndOrders();
      }
    } catch (err: any) {
      setFeedbackError(err.response?.data?.error || 'Failed to place order');
    }
  };

  // Execute Charge Order to Room Folio
  const handleConfirmRoomCharge = async () => {
    if (!lastCreatedOrderId || !chargeRoomNumber) return;
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await api.post(`/pms/restaurant/orders/${lastCreatedOrderId}/charge-room`, {
        roomNumber: chargeRoomNumber
      });

      setFeedbackSuccess(
        `Order charged directly to Room ${chargeRoomNumber} (${res.data.guestName})! Guest folio balance updated.`
      );
      setChargeRoomModalOpen(false);
      setCart([]);
      fetchCatalogAndOrders();
    } catch (err: any) {
      setFeedbackError(err.response?.data?.error || 'Failed to charge order to room');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      await api.patch(`/pms/restaurant/orders/${orderId}/status`, {
        status: nextStatus
      });
      fetchCatalogAndOrders();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleSetOrderTimer = async (orderId: string, minutes: number) => {
    try {
      await api.patch(`/pms/restaurant/orders/${orderId}/timer`, { minutes });
      setFeedbackSuccess(`Prep timer set to ${minutes} mins for order`);
      setTimeout(() => setFeedbackSuccess(null), 3000);
      fetchCatalogAndOrders();
    } catch (e) {
      alert('Failed to update prep timer');
    }
  };

  // Populate item timers state when order detail is opened
  useEffect(() => {
    if (selectedOrderForDetail) {
      const timers: { [index: number]: number } = {};
      selectedOrderForDetail.items?.forEach((item: any, idx: number) => {
        timers[idx] = item.preparationTimeMinutes || 20;
      });
      setItemTimersState(timers);
      const initialTotal = selectedOrderForDetail.estimatedReadyMinutes || 
        Math.max(...(selectedOrderForDetail.items?.map((i: any) => i.preparationTimeMinutes || 20) || [20]), 15);
      setCustomTotalMinutes(initialTotal);
    }
  }, [selectedOrderForDetail]);

  const handleItemTimeChange = (idx: number, mins: number) => {
    const updated = { ...itemTimersState, [idx]: mins };
    setItemTimersState(updated);
    // Recalculate total as max of all item times
    const maxTime = Math.max(...Object.values(updated), 10);
    setCustomTotalMinutes(maxTime);
  };

  const handleSaveItemTimers = async () => {
    if (!selectedOrderForDetail) return;
    try {
      const itemTimers = Object.entries(itemTimersState).map(([idx, mins]) => ({
        index: Number(idx),
        minutes: Number(mins)
      }));
      await api.patch(`/pms/restaurant/orders/${selectedOrderForDetail._id}/timer`, {
        minutes: customTotalMinutes,
        itemTimers
      });
      setFeedbackSuccess(`Saved food timers for Order #${selectedOrderForDetail.orderNumber} (Total: ${customTotalMinutes}m)`);
      setTimeout(() => setFeedbackSuccess(null), 3500);
      setSelectedOrderForDetail(null);
      fetchCatalogAndOrders();
    } catch (e) {
      alert('Failed to save item timers');
    }
  };

  const handleBatchUpdateRoom = async (roomNumber: string, status?: string, minutes?: number) => {
    try {
      const payload: any = {};
      if (status) payload.status = status;
      if (minutes) payload.minutes = minutes;
      await api.patch(`/pms/restaurant/rooms/${roomNumber}/orders`, payload);
      setFeedbackSuccess(`Updated all active orders for Room ${roomNumber}`);
      setTimeout(() => setFeedbackSuccess(null), 3500);
      fetchCatalogAndOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update room orders');
    }
  };

  // Group active & recent orders by Room for consolidated room management
  const roomGroups = useMemo(() => {
    const groups: Record<string, {
      roomNumber: string;
      guestName: string;
      orders: any[];
      totalAmount: number;
      activeCount: number;
      earliestEstimatedReadyAt: Date | null;
    }> = {};

    orders.forEach((ord) => {
      const roomNum = ord.room?.roomNumber || (ord.chargedToRoom && ord.notes?.match(/Room\s*(\d+)/i)?.[1]) || null;
      if (roomNum) {
        if (!groups[roomNum]) {
          groups[roomNum] = {
            roomNumber: roomNum,
            guestName: ord.guest?.fullName || ord.guest?.name || ord.room?.currentStay?.guest?.fullName || 'In-House Guest',
            orders: [],
            totalAmount: 0,
            activeCount: 0,
            earliestEstimatedReadyAt: null
          };
        }
        groups[roomNum].orders.push(ord);
        groups[roomNum].totalAmount += ord.total || 0;
        if (['NEW', 'PREPARING', 'READY'].includes(ord.status)) {
          groups[roomNum].activeCount += 1;
          if (ord.estimatedReadyAt) {
            const ordDate = new Date(ord.estimatedReadyAt);
            if (!groups[roomNum].earliestEstimatedReadyAt || ordDate < groups[roomNum].earliestEstimatedReadyAt!) {
              groups[roomNum].earliestEstimatedReadyAt = ordDate;
            }
          }
        }
      }
    });

    return Object.values(groups).sort((a, b) => {
      if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount;
      return a.roomNumber.localeCompare(b.roomNumber);
    });
  }, [orders]);

  const filteredMenuItems = selectedCatId === 'ALL'
    ? menuItems
    : menuItems.filter((i) => i.category?._id === selectedCatId || i.category === selectedCatId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="w-5 h-5 text-gold-dark" />
            <h1 className="font-serif text-2xl font-bold text-slate-900">Restaurant & Room Service POS</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Abyssinia Restaurant point of sale. Direct billing and room charging to checked-in guest folios.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500">Active In-House Checked-in Rooms:</span>
          <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {inHouseRooms.length} Rooms
          </span>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}
      {feedbackError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{feedbackError}</span>
        </div>
      )}

      {/* POS WORKSPACE: LEFT MENU CATALOG / RIGHT CART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 8 COLS: MENU CATALOG */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCatId('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                selectedCatId === 'ALL'
                  ? 'bg-slate-900 text-gold-light border border-gold/40 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCatId(cat._id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                  selectedCatId === cat._id
                    ? 'bg-slate-900 text-gold-light border border-gold/40 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredMenuItems.map((item) => (
              <div
                key={item._id}
                onClick={() => addToCart(item)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-gold hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="font-serif font-bold text-slate-900 text-sm block leading-snug">
                    {item.name}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-serif font-bold text-slate-900 text-sm">
                    {formatPrice(item.price)}
                  </span>
                  <span className="p-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700">
                    <Plus className="w-4 h-4 text-gold-dark" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT 4 COLS: ORDER CART & DIRECT ROOM CHARGE */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-gold-dark" />
              <h3 className="font-serif font-bold text-slate-900 text-base">Active Order Cart</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[10px] text-rose-600 hover:underline font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Order Type & Table Selection */}
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {(['DINE_IN', 'ROOM_SERVICE', 'TAKEAWAY'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    orderType === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {orderType === 'DINE_IN' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Restaurant Table
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                >
                  <option value="">-- Select Table --</option>
                  {tables.map((tbl) => (
                    <option key={tbl._id} value={tbl._id}>
                      {tbl.tableNumber} ({tbl.capacity} Seats - {tbl.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic">
                Cart is empty. Click menu items to add.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.menuItemId} className="py-2.5 flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatPrice(item.price)} each
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals Breakdown */}
          {cart.length > 0 && (
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT (15%):</span>
                <span>{formatPrice(cartTax)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Service Charge (10%):</span>
                <span>{formatPrice(cartServiceCharge)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total:</span>
                <span className="font-serif text-lg">{formatPrice(cartTotal)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {/* Primary Action: Direct Room Charge */}
            <button
              disabled={cart.length === 0}
              onClick={() => handlePlaceOrder(true)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              <Bed className="w-4 h-4" />
              <span>Charge to Guest Room</span>
            </button>

            {/* Standard Cash / Card Checkout */}
            <button
              disabled={cart.length === 0}
              onClick={() => handlePlaceOrder(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-gold-light border border-gold/40 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xs"
            >
              <CreditCard className="w-4 h-4 text-gold" />
              <span>Pay Cash / POS Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHARGE TO ROOM CONFIRMATION MODAL */}
      <Modal
        isOpen={chargeRoomModalOpen}
        onClose={() => setChargeRoomModalOpen(false)}
        title="Charge Order Directly to Guest Room"
        subtitle="This order will be posted straight into the guest's folio ledger"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 text-sm block">
              Order Total: {formatPrice(cartTotal)}
            </span>
            <span className="text-slate-500 mt-1 block">
              Includes 15% VAT and 10% hospitality service charge.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Checked-In Guest Room *
            </label>
            <select
              value={chargeRoomNumber}
              onChange={(e) => setChargeRoomNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
            >
              {inHouseRooms.map((r) => (
                <option key={r._id} value={r.roomNumber}>
                  Room {r.roomNumber} ({r.currentStay?.guest?.fullName})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setChargeRoomModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRoomCharge}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Post Charge to Folio
            </button>
          </div>
        </div>
      </Modal>

      {/* ORDERS MANAGEMENT: ROOM-GROUPED & TABLE VIEWS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="w-5 h-5 text-gold-dark" />
              <h3 className="font-serif text-lg font-bold text-slate-900">
                {ordersViewMode === 'ROOM_GROUPED' ? 'In-Room Dining Orders (Grouped by Room)' : 'All POS & Room Service Orders'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {ordersViewMode === 'ROOM_GROUPED'
                ? 'Multiple orders from the same room are consolidated together. Manage room tickets, batch prepare, and set per-dish timers.'
                : 'Full chronological ledger of all orders across the restaurant POS and guest suites.'}
            </p>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center">
            <button
              onClick={() => setOrdersViewMode('ROOM_GROUPED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                ordersViewMode === 'ROOM_GROUPED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-gold-dark" />
              <span>By Room ({roomGroups.length})</span>
            </button>
            <button
              onClick={() => setOrdersViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                ordersViewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>All Orders ({orders.length})</span>
            </button>
          </div>
        </div>

        {/* ----------------- VIEW 1: GROUPED BY ROOM ----------------- */}
        {ordersViewMode === 'ROOM_GROUPED' && (
          <div className="space-y-4">
            {roomGroups.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No room service orders currently active.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {roomGroups.map((group) => {
                  const hasNew = group.orders.some((o) => o.status === 'NEW');
                  const hasPreparing = group.orders.some((o) => o.status === 'PREPARING');
                  const hasReady = group.orders.some((o) => o.status === 'READY');
                  
                  const remainingMin = group.earliestEstimatedReadyAt 
                    ? Math.max(0, Math.ceil((new Date(group.earliestEstimatedReadyAt).getTime() - currentTime) / 60000))
                    : null;

                  return (
                    <div 
                      key={group.roomNumber}
                      className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4.5 space-y-3.5 hover:border-gold/50 transition-all shadow-2xs"
                    >
                      {/* Room Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-stone-200/70 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-gold-light border border-gold/40 flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                            <Bed className="w-4 h-4 text-gold" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-serif font-bold text-slate-900 text-base">
                                Room {group.roomNumber}
                              </span>
                              <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                                {group.orders.length} {group.orders.length === 1 ? 'Order' : 'Orders'}
                              </span>
                              {group.activeCount > 0 && (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                  {group.activeCount} Active
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-600 block mt-0.5 font-medium">
                              Guest: {group.guestName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                            Combined Total
                          </span>
                          <span className="font-serif font-bold text-slate-900 text-sm">
                            {formatPrice(group.totalAmount)}
                          </span>
                          {remainingMin !== null && group.activeCount > 0 && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold mt-1 ${
                              remainingMin === 0 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              <Timer className="w-2.5 h-2.5 mr-0.5 inline" />
                              {remainingMin === 0 ? 'Ready Now' : `${remainingMin}m left`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Room Batch Controls */}
                      <div className="bg-white p-2 rounded-xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Room Batch Controls:
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {hasNew && (
                            <button
                              onClick={() => handleBatchUpdateRoom(group.roomNumber, 'PREPARING')}
                              className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider"
                              title="Advance all new orders in this room to Preparing"
                            >
                              Prepare All
                            </button>
                          )}
                          {hasPreparing && (
                            <button
                              onClick={() => handleBatchUpdateRoom(group.roomNumber, 'READY')}
                              className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] uppercase tracking-wider"
                              title="Mark all cooking orders in this room as Ready"
                            >
                              Ready All
                            </button>
                          )}
                          {hasReady && (
                            <button
                              onClick={() => handleBatchUpdateRoom(group.roomNumber, 'SERVED')}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider"
                              title="Mark all orders in this room as Delivered/Served"
                            >
                              Serve All
                            </button>
                          )}

                          {/* Quick Room Timer Presets */}
                          <div className="flex items-center pl-1 space-x-1 border-l border-slate-200">
                            {[15, 25, 35].map((mins) => (
                              <button
                                key={mins}
                                onClick={() => handleBatchUpdateRoom(group.roomNumber, undefined, mins)}
                                className="px-1.5 py-1 rounded bg-slate-100 hover:bg-gold hover:text-slate-900 text-slate-600 text-[9px] font-bold"
                                title={`Set timer to ${mins}m for all orders in Room ${group.roomNumber}`}
                              >
                                +{mins}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Orders Inside this Room */}
                      <div className="space-y-2">
                        {group.orders.map((ord) => {
                          const ordRemaining = ord.estimatedReadyAt 
                            ? Math.max(0, Math.ceil((new Date(ord.estimatedReadyAt).getTime() - currentTime) / 60000))
                            : null;

                          return (
                            <div 
                              key={ord._id}
                              onClick={() => setSelectedOrderForDetail(ord)}
                              className="bg-white p-3 rounded-xl border border-stone-200/80 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono font-bold text-slate-900 text-xs">
                                    #{ord.orderNumber}
                                  </span>
                                  <StatusBadge status={ord.status} />
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-700 mt-1 line-clamp-1">
                                  {ord.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(' • ')}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                                <span className="font-serif font-bold text-slate-900 text-xs">
                                  {formatPrice(ord.total)}
                                </span>
                                {ordRemaining !== null && ord.status !== 'PAID' && ord.status !== 'CANCELLED' && (
                                  <span className="font-mono text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    ⏱️ {ordRemaining}m
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrderForDetail(ord);
                                  }}
                                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-gold hover:text-slate-900 text-slate-600 transition-colors"
                                  title="View Order Details & Adjust Food Timers"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- VIEW 2: FLAT TABLE VIEW ----------------- */}
        {ordersViewMode === 'TABLE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Destination / Room</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Prep Timer</th>
                  <th className="py-2.5 px-3">Billing</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 15).map((ord) => {
                  const remainingMin = ord.estimatedReadyAt 
                    ? Math.max(0, Math.ceil((new Date(ord.estimatedReadyAt).getTime() - currentTime) / 60000))
                    : null;

                  return (
                    <tr 
                      key={ord._id}
                      onClick={() => setSelectedOrderForDetail(ord)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {ord.orderType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {ord.room ? (
                          <span className="text-emerald-800 font-bold">Room {ord.room.roomNumber}</span>
                        ) : ord.table ? (
                          <span>{ord.table.tableNumber}</span>
                        ) : (
                          <span className="text-slate-400">Takeaway</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]">
                        {ord.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {formatPrice(ord.total)}
                      </td>
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        {ord.status !== 'PAID' && ord.status !== 'CANCELLED' && ord.status !== 'SERVED' ? (
                          <div className="space-y-1">
                            {remainingMin !== null && (
                              <div className="flex items-center space-x-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  remainingMin === 0 
                                    ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  <Timer className="w-2.5 h-2.5 mr-0.5 inline" />
                                  {remainingMin === 0 ? 'Ready Now!' : `${remainingMin}m left`}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              {[15, 25, 35].map((mins) => (
                                <button
                                  key={mins}
                                  onClick={() => handleSetOrderTimer(ord._id, mins)}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-gold hover:text-slate-900 text-slate-600 font-bold text-[9px] transition-colors"
                                  title={`Set estimated prep time to ${mins} minutes`}
                                >
                                  +{mins}m
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {ord.chargedToRoom ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                            ROOM CHARGE
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px] uppercase font-semibold">
                            {ord.paymentMethod || 'DIRECT'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="p-1 rounded bg-slate-100 hover:bg-gold text-slate-700"
                            title="Click to see full order & set food timers"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {ord.status === 'NEW' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord._id, 'PREPARING')}
                              className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            >
                              Prepare
                            </button>
                          )}
                          {ord.status === 'PREPARING' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord._id, 'READY')}
                              className="bg-cyan-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            >
                              Ready
                            </button>
                          )}
                          {ord.status === 'READY' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord._id, 'SERVED')}
                              className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            >
                              Serve
                            </button>
                          )}
                          {ord.status === 'SERVED' && !ord.paidAt && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord._id, 'PAID')}
                              className="bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED ORDER MODAL: CLICK & SEE ORDER + PER-FOOD ITEM TIMERS */}
      <Modal
        isOpen={Boolean(selectedOrderForDetail)}
        onClose={() => setSelectedOrderForDetail(null)}
        title={`Order #${selectedOrderForDetail?.orderNumber} Breakdown & Food Prep Timers`}
        subtitle={
          selectedOrderForDetail?.room 
            ? `Room ${selectedOrderForDetail.room.roomNumber} • ${selectedOrderForDetail.guest?.fullName || 'Guest'}` 
            : selectedOrderForDetail?.table 
              ? `Table ${selectedOrderForDetail.table.tableNumber}` 
              : 'Takeaway Order'
        }
      >
        {selectedOrderForDetail && (
          <div className="space-y-4 text-xs">
            {/* Header info bar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Order Status
                </span>
                <div className="mt-1 flex items-center space-x-2">
                  <StatusBadge status={selectedOrderForDetail.status} />
                  <span className="text-slate-500 text-xs">
                    Placed at {new Date(selectedOrderForDetail.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Amount
                </span>
                <span className="font-serif font-bold text-slate-900 text-base block mt-0.5">
                  {formatPrice(selectedOrderForDetail.total)}
                </span>
              </div>
            </div>

            {/* Itemized Food List with Per-Item Prep Timer Controls */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Food Items & Individual Kitchen Timers
              </label>
              
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {selectedOrderForDetail.items?.map((item: any, idx: number) => {
                  const itemMins = itemTimersState[idx] ?? (item.preparationTimeMinutes || 20);

                  return (
                    <div key={idx} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            ({formatPrice(item.unitPrice)} each)
                          </span>
                        </div>
                        {item.specialInstructions && (
                          <p className="text-[11px] text-amber-800 italic mt-0.5">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                        <span className="font-mono text-slate-700 font-bold text-[11px] block mt-0.5">
                          Subtotal: {formatPrice(item.subtotal)}
                        </span>
                      </div>

                      {/* Per-Food Item Timer Adjuster */}
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 shrink-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                            <Clock className="w-3 h-3 text-gold mr-1" />
                            Dish Prep Time:
                          </span>
                          <span className="font-mono font-bold text-xs text-amber-900 bg-white border border-amber-300 px-2 py-0.5 rounded">
                            {itemMins} mins
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 pt-1">
                          {[10, 15, 20, 25, 35].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => handleItemTimeChange(idx, m)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                itemMins === m 
                                  ? 'bg-slate-900 text-gold-light' 
                                  : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculated Total Kitchen Preparation Time Banner */}
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-950 flex items-center justify-center font-bold shrink-0">
                  <Timer className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                    Calculated Total Preparation Time
                  </span>
                  <p className="text-xs text-amber-950 font-medium mt-0.5">
                    Order will be ready in approximately: <strong>{customTotalMinutes} minutes</strong>
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Estimated Ready at: {new Date(Date.now() + customTotalMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-amber-300">
                  {[15, 25, 35, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCustomTotalMinutes(m)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        customTotalMinutes === m
                          ? 'bg-slate-900 text-gold-light'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {selectedOrderForDetail.status === 'NEW' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleUpdateOrderStatus(selectedOrderForDetail._id, 'PREPARING');
                      setSelectedOrderForDetail(null);
                    }}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Start Cooking
                  </button>
                )}
                {selectedOrderForDetail.status === 'PREPARING' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleUpdateOrderStatus(selectedOrderForDetail._id, 'READY');
                      setSelectedOrderForDetail(null);
                    }}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Mark Ready for Room
                  </button>
                )}
                {selectedOrderForDetail.status === 'READY' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleUpdateOrderStatus(selectedOrderForDetail._id, 'SERVED');
                      setSelectedOrderForDetail(null);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemTimers}
                  className="bg-slate-900 hover:bg-slate-800 text-gold-light px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-gold/40 shadow-xs flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4 text-gold" />
                  <span>Save Food Timers ({customTotalMinutes}m)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
