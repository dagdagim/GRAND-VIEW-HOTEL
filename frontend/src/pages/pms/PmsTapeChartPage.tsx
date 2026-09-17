import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  User, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const PmsTapeChartPage: React.FC = () => {
  const { formatPrice } = useCurrency();

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // Start yesterday for context
    return d.toISOString().split('T')[0];
  });
  const [daysCount, setDaysCount] = useState<number>(14);
  const [chartData, setChartData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected reservation modal
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);

  const fetchTapeChart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pms/calendar/tape-chart', {
        params: {
          startDate,
          days: daysCount
        }
      });
      setChartData(res.data);
    } catch (e) {
      console.error('Failed to load tape chart data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTapeChart();
  }, [startDate, daysCount]);

  const handlePrev = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setStartDate(d.toISOString().split('T')[0]);
  };

  // Helper to test if a date string falls inside a reservation's [checkIn, checkOut)
  const getBookingForCell = (bookings: any[], dateStr: string) => {
    return bookings.find((b: any) => {
      const cIn = b.checkInDate.split('T')[0];
      const cOut = b.checkOutDate.split('T')[0];
      return dateStr >= cIn && dateStr < cOut;
    });
  };

  // Test if a cell is the first day of that booking
  const isBookingStart = (booking: any, dateStr: string) => {
    return booking.checkInDate.split('T')[0] === dateStr;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gold-dark" />
            <h1 className="font-serif text-2xl font-bold text-slate-900">Reservation Tape Chart</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Horizontal room timeline grid. Real-time availability and multi-day reservation inspection.
          </p>
        </div>

        {/* Date Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Previous 7 Days"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Next 7 Days"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <select
            value={daysCount}
            onChange={(e) => setDaysCount(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700"
          >
            <option value={14}>14 Days View</option>
            <option value={21}>21 Days View</option>
            <option value={30}>30 Days View</option>
          </select>
        </div>
      </div>

      {/* TAPE CHART TIMELINE MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">Loading timeline grid...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left select-none">
              {/* Table Headers: Days */}
              <thead>
                <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
                  <th className="p-3 w-36 shrink-0 sticky left-0 bg-slate-900 z-10 border-r border-slate-800 uppercase tracking-wider text-[11px] font-bold">
                    Room
                  </th>
                  {chartData?.dateHeaders?.map((h: any) => {
                    const isToday = h.dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <th
                        key={h.dateStr}
                        className={`p-2 min-w-[65px] text-center border-r border-slate-800 ${
                          isToday ? 'bg-gold/30 text-gold-light font-bold' : h.isWeekend ? 'bg-slate-800/60' : ''
                        }`}
                      >
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">{h.dayName}</span>
                        <span className="block text-sm font-bold">{h.dayNum} {h.monthName}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body: Rooms & Booking Cells */}
              <tbody className="divide-y divide-slate-100 text-xs">
                {chartData?.rooms?.map((room: any) => (
                  <tr key={room._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Sticky Room Label */}
                    <td className="p-2.5 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-slate-900 text-sm">
                          {room.roomNumber}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1 rounded ${
                          room.status === 'OCCUPIED'
                            ? 'bg-blue-50 text-blue-700'
                            : room.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {room.roomType?.code || 'RM'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Floor {room.floor} • {room.cleanStatus}
                      </span>
                    </td>

                    {/* Date Interval Cells */}
                    {chartData?.dateHeaders?.map((h: any) => {
                      const booking = getBookingForCell(room.bookings, h.dateStr);
                      const isStart = booking ? isBookingStart(booking, h.dateStr) : false;
                      const isToday = h.dateStr === new Date().toISOString().split('T')[0];

                      return (
                        <td
                          key={h.dateStr}
                          className={`p-1 border-r border-slate-100 h-12 relative ${
                            isToday ? 'bg-amber-50/30' : h.isWeekend ? 'bg-slate-50/40' : ''
                          }`}
                        >
                          {booking ? (
                            <div
                              onClick={() => {
                                setSelectedBooking(booking);
                                setBookingModalOpen(true);
                              }}
                              className={`h-9 rounded-md px-2 flex items-center cursor-pointer transition-all shadow-2xs hover:brightness-95 truncate text-[11px] font-semibold ${
                                booking.status === 'CHECKED_IN'
                                  ? 'bg-blue-600 text-white border border-blue-700'
                                  : booking.status === 'CONFIRMED'
                                  ? 'bg-amber-500 text-white border border-amber-600'
                                  : 'bg-emerald-600 text-white border border-emerald-700'
                              }`}
                              title={`#${booking.bookingNumber} • ${booking.guest?.fullName || 'Guest'} (${booking.status})`}
                            >
                              {isStart ? (
                                <span className="truncate font-bold">
                                  #{booking.bookingNumber.slice(-5)} {booking.guest?.fullName?.split(' ')[0]}
                                </span>
                              ) : (
                                <span className="text-white/70 text-[10px]">···</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RESERVATION INSPECTION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title={`Reservation #${selectedBooking?.bookingNumber}`}
        subtitle={`Status: ${selectedBooking?.status} • Source: ${selectedBooking?.source}`}
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedBooking.guest?.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="font-semibold text-slate-800">
                  {selectedBooking.guest?.phone} ({selectedBooking.guest?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dates:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedBooking.checkInDate).toLocaleDateString()} → {new Date(selectedBooking.checkOutDate).toLocaleDateString()} ({selectedBooking.nights} nights)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room Type:</span>
                <span className="font-semibold text-slate-800">
                  {selectedBooking.roomType?.name}
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Stay Price:</span>
                <span className="font-bold text-slate-900">
                  {formatPrice(selectedBooking.pricing?.total || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="text-emerald-700 font-semibold">
                  {formatPrice(selectedBooking.pricing?.paidAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding Balance:</span>
                <span className={`font-bold ${selectedBooking.pricing?.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatPrice(selectedBooking.pricing?.balance || 0)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              {selectedBooking.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={async () => {
                    await api.post(`/pms/reservations/${selectedBooking._id}/cancel`, {
                      reason: 'Cancelled via Tape Chart'
                    });
                    setBookingModalOpen(false);
                    fetchTapeChart();
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
