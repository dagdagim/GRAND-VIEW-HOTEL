import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  Globe, 
  User, 
  Eye, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  BedDouble,
  DollarSign
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const PmsReservationsPage: React.FC = () => {
  const { formatPrice } = useCurrency();

  const [reservations, setReservations] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [activeSourceTab, setActiveSourceTab] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Details Modal
  const [selectedRes, setSelectedRes] = useState<any | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pms/reservations', {
        params: {
          source: activeSourceTab === 'ONLINE' ? 'WEBSITE' : activeSourceTab,
          status: statusFilter,
          search: searchQuery
        }
      });
      setReservations(res.data.reservations || []);
      setTotalCount(res.data.total || 0);
    } catch (e) {
      console.error('Failed to fetch reservations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [activeSourceTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReservations();
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you wish to cancel this reservation? Inventory will be released immediately.')) return;
    try {
      await api.post(`/pms/reservations/${id}/cancel`, {
        reason: 'Staff cancelled via PMS Reservation Center'
      });
      fetchReservations();
      setDetailsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cancellation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & SOURCE TABS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-gold-dark" />
              <h1 className="font-serif text-2xl font-bold text-slate-900">Reservations Central</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage all online bookings, walk-ins, phone reservations, and corporate folios in one place.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            Total Bookings: <span className="text-slate-900 font-bold">{totalCount}</span>
          </div>
        </div>

        {/* Channel Source Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {[
            { label: 'All Channels', value: 'ALL' },
            { label: '🌐 Online Website', value: 'ONLINE' },
            { label: 'Front Desk Walk-in', value: 'WALK_IN' },
            { label: 'Phone & Direct', value: 'PHONE' },
            { label: 'Corporate & Embassies', value: 'CORPORATE' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveSourceTab(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                activeSourceTab === tab.value
                  ? 'bg-slate-900 text-gold-light border border-gold/40 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SEARCH & STATUS FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Guest Name, Booking # (e.g. GVH-10482), or Phone..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-xs"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CHECKED_IN">CHECKED IN (In-House)</option>
          <option value="CHECKED_OUT">CHECKED OUT</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* 3. RESERVATIONS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">Loading reservations ledger...</div>
        ) : reservations.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <p className="font-semibold text-slate-700">No reservations found matching criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your channel source or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Room / Type</th>
                  <th className="py-3 px-4">Dates & Nights</th>
                  <th className="py-3 px-4">Total Price</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((r) => {
                  const isOnline = r.source === 'WEBSITE';
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Booking # */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{r.bookingNumber}
                      </td>

                      {/* Source with prominent ONLINE badge */}
                      <td className="py-3 px-4">
                        {isOnline ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            <Globe className="w-3 h-3 text-blue-600" />
                            <span>ONLINE</span>
                          </span>
                        ) : (
                          <StatusBadge status={r.source} />
                        )}
                      </td>

                      {/* Guest */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[150px]">
                          {r.guest?.fullName || `${r.guest?.firstName} ${r.guest?.lastName}`}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {r.guest?.phone}
                        </div>
                      </td>

                      {/* Room / Type */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {r.assignedRoom ? `Room ${r.assignedRoom.roomNumber}` : 'Unassigned'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {r.roomType?.name}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4">
                        <span className="block font-medium text-slate-800">
                          {new Date(r.checkInDate).toLocaleDateString()} → {new Date(r.checkOutDate).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {r.nights} Night{r.nights > 1 ? 's' : ''} ({r.adults} Adults)
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatPrice(r.pricing?.total || 0)}
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4">
                        <StatusBadge status={r.paymentStatus} />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedRes(r);
                            setDetailsModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RESERVATION DETAILS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Reservation Details: #${selectedRes?.bookingNumber}`}
        subtitle={`Channel: ${selectedRes?.source} • Status: ${selectedRes?.status}`}
      >
        {selectedRes && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">Guest</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {selectedRes.guest?.fullName}
                </span>
                <span className="text-slate-500">{selectedRes.guest?.phone}</span>
                <span className="text-slate-400 block">{selectedRes.guest?.email}</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">Stay Period</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {selectedRes.nights} Nights
                </span>
                <span className="text-slate-600">
                  {new Date(selectedRes.checkInDate).toLocaleDateString()} to {new Date(selectedRes.checkOutDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Room Type:</span>
                <span className="font-bold text-slate-900">{selectedRes.roomType?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Room:</span>
                <span className="font-bold text-slate-900">
                  {selectedRes.assignedRoom ? `Room ${selectedRes.assignedRoom.roomNumber}` : 'Not assigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-bold text-slate-900">{selectedRes.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm">
                <span>Grand Total:</span>
                <span className="text-slate-900">{formatPrice(selectedRes.pricing?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Paid / Balance:</span>
                <span className={selectedRes.pricing?.balance > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                  Paid {formatPrice(selectedRes.pricing?.paidAmount || 0)} / Bal {formatPrice(selectedRes.pricing?.balance || 0)}
                </span>
              </div>
            </div>

            {selectedRes.specialRequests && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold text-[10px] uppercase tracking-wider block">Special Requests:</span>
                <p className="mt-0.5">{selectedRes.specialRequests}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {selectedRes.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => handleCancelBooking(selectedRes._id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel Booking
                </button>
              )}
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
