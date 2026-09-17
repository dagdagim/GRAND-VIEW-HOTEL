import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Percent, 
  LogIn, 
  LogOut, 
  DollarSign, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ConciergeBell,
  UtensilsCrossed,
  ShieldCheck,
  BedDouble,
  Users,
  AlertTriangle,
  Receipt,
  UserCog,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Coffee,
  CheckCheck
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const PmsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSummary = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.get('/pms/dashboard');
      setSummary(res.data);
    } catch (e) {
      console.error('Failed to load PMS dashboard data', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => {
      fetchSummary(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);


  const role = user?.role || 'HOTEL_MANAGER';
  const metrics = summary?.metrics || {};

  // Quick room status updater for housekeeping actions
  const handleQuickRoomStatus = async (roomId: string, status: string, cleanStatus: string) => {
    try {
      await api.patch(`/pms/rooms/${roomId}/status`, { status, cleanStatus });
      fetchSummary(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update room status');
    }
  };

  // Quick order prep timer setter
  const handleSetOrderTimer = async (orderId: string, minutes: number) => {
    try {
      await api.patch(`/pms/restaurant/orders/${orderId}/timer`, { minutes });
      fetchSummary(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to set order timer');
    }
  };

  if (loading && !summary) {
    return (
      <div className="py-28 text-center">
        <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading dedicated operational workspace...</p>
      </div>
    );
  }

  // =========================================================================
  // 1. RECEPTIONIST DASHBOARD
  // =========================================================================
  if (role === 'RECEPTIONIST') {
    const arrivals = summary?.receptionist?.arrivals || [];
    const departures = summary?.receptionist?.departures || [];
    const statusCounts = summary?.receptionist?.statusCounts || {};

    return (
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Front Desk Operations
              </span>
              <span className="text-xs text-slate-400 font-mono">Shift Operator: {user?.name}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live front desk queue: arrivals, departures, room keys, and guest check-ins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/pms/front-desk?action=walkin"
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>New Walk-in</span>
            </Link>
            <Link
              to="/pms/front-desk"
              className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              <ConciergeBell className="w-4 h-4 text-gold" />
              <span>Floor Grid</span>
            </Link>
            <Link
              to="/pms/calendar"
              className="inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Tape Chart</span>
            </Link>
          </div>
        </div>

        {/* Front Desk KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Today's Arrivals"
            value={arrivals.length}
            subtext={`${arrivals.filter((a: any) => a.status === 'CHECKED_IN').length} checked in`}
            icon={LogIn}
          />
          <StatCard
            title="Today's Departures"
            value={departures.length}
            subtext="Check-out queue"
            icon={LogOut}
          />
          <StatCard
            title="Occupied Rooms"
            value={statusCounts.OCCUPIED || 0}
            subtext={`${metrics.occupancyRate || 0}% hotel occupancy`}
            icon={BedDouble}
          />
          <StatCard
            title="Reserved Rooms"
            value={statusCounts.RESERVED || 0}
            subtext="Awaiting guest arrival"
            icon={Clock}
          />
          <StatCard
            title="Available Keys"
            value={statusCounts.AVAILABLE || 0}
            subtext="Clean & ready for sale"
            icon={CheckCircle2}
          />
        </div>

        {/* Tables Grid: Arrivals and Departures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Expected Arrivals */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-emerald-600" />
                    Today's Expected Arrivals
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Guests scheduled to arrive and check in today</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  {arrivals.length} Arriving
                </span>
              </div>

              {arrivals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No pending arrivals scheduled for today.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {arrivals.map((res: any) => {
                    const guestName = res.guest?.fullName || `${res.guest?.firstName || ''} ${res.guest?.lastName || ''}`.trim() || 'Guest';
                    return (
                      <div key={res._id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm truncate">{guestName}</span>
                            <span className="font-mono text-[10px] text-slate-400">#{res.bookingNumber}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>Room: <strong>{res.assignedRoom?.roomNumber || 'Unassigned'}</strong></span>
                            <span>•</span>
                            <span>{res.roomType?.name}</span>
                            <span>•</span>
                            <span>{res.nights} Night(s)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            res.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {res.paymentStatus}
                          </span>
                          <Link
                            to={`/pms/front-desk?checkin=${res._id}`}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Check-In
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <Link to="/pms/reservations" className="text-xs font-bold text-navy-800 hover:text-gold flex items-center justify-end gap-1">
                View All Reservations <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Today's Expected Departures */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-600" />
                    Today's Scheduled Departures
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">In-house guests scheduled for check-out settlement</p>
                </div>
                <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                  {departures.length} Departures
                </span>
              </div>

              {departures.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No check-outs scheduled for today.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {departures.map((res: any) => {
                    const guestName = res.guest?.fullName || `${res.guest?.firstName || ''} ${res.guest?.lastName || ''}`.trim() || 'Guest';
                    return (
                      <div key={res._id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm truncate">{guestName}</span>
                            <span className="font-mono text-[10px] text-slate-400">#{res.bookingNumber}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>Room: <strong className="text-blue-700">{res.assignedRoom?.roomNumber || 'Occupied'}</strong></span>
                            <span>•</span>
                            <span>{res.roomType?.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to="/pms/front-desk"
                            className="bg-slate-900 hover:bg-slate-800 text-gold-light px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Check-Out
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <Link to="/pms/front-desk" className="text-xs font-bold text-navy-800 hover:text-gold flex items-center justify-end gap-1">
                Open Full Floor Grid <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. RESTAURANT & F&B OPERATIONS DASHBOARD
  // =========================================================================
  if (role === 'RESTAURANT_STAFF') {
    const restaurantData = summary?.restaurant || {};
    const orders = restaurantData.todayOrders || [];
    const tables = restaurantData.tables || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Restaurant & F&B Service Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">Staff: {user?.name}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dining tables, active kitchen tickets, room charge postings, and daily food & beverage receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/pms/restaurant"
              className="inline-flex items-center space-x-2 bg-gold-600 hover:bg-gold-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Open POS Terminal</span>
            </Link>
          </div>
        </div>

        {/* F&B KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's F&B Sales"
            value={formatPrice(restaurantData.revenueToday || 0)}
            subtext="Dining & Room Service"
            icon={DollarSign}
            trend={{ value: '+8.4%', isPositive: true }}
          />
          <StatCard
            title="Orders Served Today"
            value={orders.length}
            subtext="Tickets created"
            icon={UtensilsCrossed}
          />
          <StatCard
            title="Occupied Tables"
            value={restaurantData.tablesOccupied || 0}
            subtext={`of ${tables.length} dining tables`}
            icon={Users}
          />
          <StatCard
            title="Direct Room Charges"
            value={(restaurantData.roomChargeOrders || []).length}
            subtext="Billed to in-house folios"
            icon={Receipt}
          />
        </div>

        {/* Active Tables & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables Status Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-600" />
                Dining Room Table Status
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Total {tables.length} Tables</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {tables.map((tbl: any) => {
                const isOccupied = tbl.status === 'OCCUPIED';
                return (
                  <div
                    key={tbl._id}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isOccupied
                        ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-bold block text-sm">Table {tbl.tableNumber}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{tbl.capacity} Seats</span>
                    <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isOccupied ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {tbl.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Orders Stream */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-gold-600" />
                  Today's Restaurant Orders
                </h2>
                <Link to="/pms/restaurant" className="text-xs font-bold text-gold-700 hover:underline">
                  New Order +
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No dining tickets recorded today yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 8).map((order: any) => (
                    <div key={order._id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            Order #{order.orderNumber || order._id.slice(-5)}
                          </span>
                          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {order.table ? `Table ${order.table.tableNumber}` : 'Dining'}
                          </span>
                          {order.paymentMethod === 'ROOM_CHARGE' && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold">
                              Charged to Room {order.roomChargeDetails?.room?.roomNumber || ''}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')}
                        </div>

                        {/* Kitchen Prep Timer Controls */}
                        {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Set Timer:</span>
                            {[15, 25, 35].map((mins) => (
                              <button
                                key={mins}
                                onClick={() => handleSetOrderTimer(order._id, mins)}
                                className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition-colors"
                              >
                                +{mins}m
                              </button>
                            ))}
                            {order.estimatedReadyAt && (
                              <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded ml-1">
                                ⏱️ Ready ~{new Date(order.estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatPrice(order.total)}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <Link to="/pms/restaurant" className="text-xs font-bold text-navy-800 hover:text-gold flex items-center justify-end gap-1">
                Go to POS Terminal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. HOUSEKEEPING DASHBOARD
  // =========================================================================
  if (role === 'HOUSEKEEPING' || (role as string) === 'HOUSEKEEPER') {
    const hkData = summary?.housekeeping || {};
    const dirtyRooms = hkData.dirtyRooms || [];
    const cleaningRooms = hkData.cleaningRooms || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Housekeeping Command Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">Supervisor: {user?.name}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Room turnaround pipeline: checkout cleanings, linen servicing, and room release.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/pms/housekeeping"
              className="inline-flex items-center space-x-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Full Cleaning Board</span>
            </Link>
            <Link
              to="/pms/maintenance"
              className="inline-flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <span>Report Defect</span>
            </Link>
          </div>
        </div>

        {/* Housekeeping KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Dirty Rooms Queue"
            value={hkData.dirtyCount || 0}
            subtext="Needs cleaning"
            icon={AlertTriangle}
          />
          <StatCard
            title="Currently Cleaning"
            value={hkData.cleaningCount || 0}
            subtext="Attendants servicing"
            icon={Sparkles}
          />
          <StatCard
            title="Inspected & Ready"
            value={hkData.inspectedCount || 0}
            subtext="Awaiting release"
            icon={CheckCheck}
          />
          <StatCard
            title="Cleanliness Score"
            value={`${hkData.progressPct || 0}%`}
            subtext={`${hkData.cleanCount || 0} of 32 rooms ready`}
            icon={Percent}
            trend={{ value: 'Passing', isPositive: true }}
          />
        </div>

        {/* Action Table: Dirty Rooms Queue with 1-Click Status buttons */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Rooms Requiring Immediate Service (DIRTY Queue)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Checked-out and turnover rooms awaiting attendant assignment</p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
              {dirtyRooms.length} Rooms
            </span>
          </div>

          {dirtyRooms.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span>All rooms are currently clean or inspected! Excellent turnaround.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Room Key</th>
                    <th className="px-5 py-3">Floor</th>
                    <th className="px-5 py-3">Room Category</th>
                    <th className="px-5 py-3">Current Status</th>
                    <th className="px-5 py-3 text-right">Instant Operational Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {dirtyRooms.map((rm: any) => (
                    <tr key={rm._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-serif text-slate-900 text-base">
                        Room {rm.roomNumber}
                      </td>
                      <td className="px-5 py-3.5">Floor {rm.floor}</td>
                      <td className="px-5 py-3.5">{rm.roomType?.name || 'Standard'}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                          DIRTY
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleQuickRoomStatus(rm._id, 'CLEANING', 'DIRTY')}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Start Cleaning
                        </button>
                        <button
                          onClick={() => handleQuickRoomStatus(rm._id, 'AVAILABLE', 'CLEAN')}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Mark Ready (Available)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ACTIVE CLEANING PIPELINE TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                Rooms Currently Undergoing Active Cleaning ({cleaningRooms.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Attendants currently inside rooms servicing linens and sanitizing</p>
            </div>
            <span className="text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 rounded-full">
              {cleaningRooms.length} In Progress
            </span>
          </div>

          {cleaningRooms.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No rooms currently undergoing cleaning. Click "Start Cleaning" on any dirty room above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Room Key</th>
                    <th className="px-5 py-3">Floor</th>
                    <th className="px-5 py-3">Room Category</th>
                    <th className="px-5 py-3">Cleanliness State</th>
                    <th className="px-5 py-3 text-right">Attendant Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {cleaningRooms.map((rm: any) => (
                    <tr key={rm._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-serif text-slate-900 text-base">
                        Room {rm.roomNumber}
                      </td>
                      <td className="px-5 py-3.5">Floor {rm.floor}</td>
                      <td className="px-5 py-3.5">{rm.roomType?.name || 'Standard'}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-cyan-50 text-cyan-700 font-bold px-2 py-0.5 rounded border border-cyan-200 text-[10px] animate-pulse">
                          CLEANING IN PROGRESS
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleQuickRoomStatus(rm._id, 'CLEANING', 'INSPECTED')}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Mark Inspected
                        </button>
                        <button
                          onClick={() => handleQuickRoomStatus(rm._id, 'AVAILABLE', 'CLEAN')}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Release & Mark Ready
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MANAGER & EXECUTIVE DASHBOARD (Default for MANAGER, ADMIN, ACCOUNTANT)
  // =========================================================================
  const managerData = summary?.manager || {};
  const recentLogs = managerData.recentAuditLogs || [];

  return (
    <div className="space-y-6">
      {/* 1. WELCOME & OPERATIONS OVERVIEW BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-dark bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold/30">
              Executive Hotel Cockpit
            </span>
            <span className="text-xs text-slate-400 font-mono">Role: {user?.role}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {user?.name || 'Manager'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete executive overview: revenue management, occupancy KPIs, departmental sales, and staff activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/pms/reports"
            className="inline-flex items-center space-x-1.5 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
          >
            <BarChart3 className="w-4 h-4 text-gold" />
            <span>Financial Reports</span>
          </Link>
          <Link
            to="/pms/staff"
            className="inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <UserCog className="w-4 h-4" />
            <span>Staff Access</span>
          </Link>
          <Link
            to="/pms/front-desk"
            className="inline-flex items-center space-x-1.5 bg-gold-600 hover:bg-gold-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
          >
            <ConciergeBell className="w-4 h-4" />
            <span>Front Desk</span>
          </Link>
        </div>
      </div>

      {/* 2. OPERATIONAL KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Occupancy"
          value={`${metrics.occupancyRate || 0}%`}
          subtext={`${metrics.occupiedRooms || 0} of ${metrics.totalRooms || 32} rooms occupied`}
          icon={Percent}
          trend={{ value: 'Normal', isPositive: true }}
        />
        <StatCard
          title="Today's Arrivals"
          value={metrics.todayArrivalsCount || 0}
          subtext="Expected check-ins"
          icon={LogIn}
        />
        <StatCard
          title="Today's Departures"
          value={metrics.todayDeparturesCount || 0}
          subtext="Expected check-outs"
          icon={LogOut}
        />
        <StatCard
          title="Gross Revenue Today"
          value={formatPrice(metrics.revenueToday || 0)}
          subtext="Rooms + Dining Receipts"
          icon={DollarSign}
          trend={{ value: '+12%', isPositive: true }}
        />
        <StatCard
          title="Rooms Cleanliness"
          value={`${metrics.housekeepingProgress || 0}%`}
          subtext={`${metrics.dirtyRoomsCount || 0} dirty rooms queued`}
          icon={Sparkles}
        />
      </div>

      {/* 3. DEPARTMENTAL REVENUE & ROOM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Department Revenue Today
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Room Accommodation</span>
                <span className="text-slate-900 font-mono">{formatPrice(metrics.roomRevenueToday || 0)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-navy-900 rounded-full" 
                  style={{ width: `${metrics.revenueToday > 0 ? ((metrics.roomRevenueToday || 0) / metrics.revenueToday) * 100 : 75}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Food & Beverage (POS)</span>
                <span className="text-slate-900 font-mono">{formatPrice(metrics.restaurantRevenueToday || 0)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gold-600 rounded-full" 
                  style={{ width: `${metrics.revenueToday > 0 ? ((metrics.restaurantRevenueToday || 0) / metrics.revenueToday) * 100 : 25}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Daily Performance Target:</span>
            <span className="font-bold text-emerald-700">89.4% Achieved</span>
          </div>
        </div>

        {/* Room Inventory Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-blue-600" />
            Room Inventory Status (32 Keys)
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Available Clean</span>
              <span className="text-xl font-bold text-emerald-700 font-mono mt-1">{metrics.availableRooms || 0}</span>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="text-slate-500 block">Occupied</span>
              <span className="text-xl font-bold text-blue-700 font-mono mt-1">{metrics.occupiedRooms || 0}</span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-slate-500 block">Reserved</span>
              <span className="text-xl font-bold text-amber-700 font-mono mt-1">{metrics.reservedRooms || 0}</span>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
              <span className="text-slate-500 block">Dirty / Turnover</span>
              <span className="text-xl font-bold text-rose-700 font-mono mt-1">{metrics.dirtyRoomsCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Operational Security & Audit Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Recent Staff Audit Logs
            </h2>
            <Link to="/pms/audit-logs" className="text-xs text-gold-700 font-bold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentLogs.slice(0, 4).map((log: any) => (
              <div key={log._id} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.userId?.name || 'SYSTEM'} • {log.entity}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PmsDashboardPage;
