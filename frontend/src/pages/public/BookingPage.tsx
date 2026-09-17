import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Bed, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Clock
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  // Wizard Steps: 1 = Dates & Rooms, 2 = Guest Info & Customization, 3 = Payment & Confirmation
  const [step, setStep] = useState<number>(1);

  // Search parameters state
  const today = new Date();
  const defaultCheckIn = searchParams.get('checkIn') || today.toISOString().split('T')[0];
  const nextTwoDays = new Date(today);
  nextTwoDays.setDate(nextTwoDays.getDate() + 2);
  const defaultCheckOut = searchParams.get('checkOut') || nextTwoDays.toISOString().split('T')[0];

  const [checkInDate, setCheckInDate] = useState<string>(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string>(defaultCheckOut);
  const [adults, setAdults] = useState<number>(Number(searchParams.get('guests')) || 2);
  const [children, setChildren] = useState<number>(0);

  // Availability query state
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [nights, setNights] = useState<number>(2);

  // Guest Information state
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: 'Ethiopian',
    specialRequests: '',
    arrivalTime: '14:00',
    promoCode: ''
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'PAY_AT_HOTEL' | 'CHAPA' | 'TELEBIRR' | 'CREDIT_CARD'>('PAY_AT_HOTEL');
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Query availability from backend
  const fetchAvailability = async () => {
    if (!checkInDate || !checkOutDate) return;
    setLoadingAvailability(true);
    setBookingError(null);

    try {
      const res = await api.get('/public/availability', {
        params: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: adults + children
        }
      });

      setAvailableRooms(res.data.availability || []);
      setNights(res.data.nights || 1);

      // If a roomType was passed in URL, auto-select it if available
      const requestedRtId = searchParams.get('roomType');
      if (requestedRtId && res.data.availability) {
        const found = res.data.availability.find((r: any) => r.roomTypeId === requestedRtId);
        if (found && found.availableRoomsCount > 0) {
          setSelectedRoom(found);
        }
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.error || 'Failed to check room availability.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [checkInDate, checkOutDate, adults, children]);

  // Pricing calculations
  const calculatePricing = () => {
    if (!selectedRoom) return { subtotal: 0, tax: 0, serviceCharge: 0, total: 0 };
    const subtotal = selectedRoom.basePrice * nights;
    const tax = Math.round(subtotal * 0.15 * 100) / 100; // 15% VAT
    const serviceCharge = Math.round(subtotal * 0.10 * 100) / 100; // 10% Service Charge
    const total = subtotal + tax + serviceCharge;
    return { subtotal, tax, serviceCharge, total };
  };

  const pricing = calculatePricing();

  // Handle final reservation submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setSubmittingBooking(true);
    setBookingError(null);

    try {
      const payload = {
        roomTypeId: selectedRoom.roomTypeId,
        checkInDate,
        checkOutDate,
        adults,
        children,
        guest: guestInfo,
        paymentMethod,
        specialRequests: guestInfo.specialRequests,
        arrivalTime: guestInfo.arrivalTime
      };

      const res = await api.post('/public/booking', payload);
      const bookingNumber = res.data.booking.bookingNumber;

      if (res.data.checkoutUrl) {
        // Redirect directly to Chapa official hosted checkout gateway
        window.location.href = res.data.checkoutUrl;
        return;
      }

      // Direct to confirmation page
      navigate(`/booking/confirmation/${bookingNumber}`);
    } catch (err: any) {
      setBookingError(err.response?.data?.error || 'Unable to complete reservation. Please try again.');
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Wizard Progress Stepper */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-stone-900' : 'text-stone-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1 ? 'bg-stone-900 text-gold-light' : 'bg-stone-200 text-stone-500'
              }`}>
                1
              </div>
              <span className="hidden sm:inline">Select Room</span>
            </div>

            <div className={`h-0.5 flex-1 mx-4 ${step >= 2 ? 'bg-stone-900' : 'bg-stone-200'}`}></div>

            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-stone-900' : 'text-stone-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2 ? 'bg-stone-900 text-gold-light' : 'bg-stone-200 text-stone-500'
              }`}>
                2
              </div>
              <span className="hidden sm:inline">Guest Details</span>
            </div>

            <div className={`h-0.5 flex-1 mx-4 ${step >= 3 ? 'bg-stone-900' : 'bg-stone-200'}`}></div>

            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-stone-900' : 'text-stone-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3 ? 'bg-stone-900 text-gold-light' : 'bg-stone-200 text-stone-500'
              }`}>
                3
              </div>
              <span className="hidden sm:inline">Payment & Review</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {bookingError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: DATES & ROOM SELECTION */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-8">
            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gold" />
                <span>Choose Your Stay Dates & Party Size</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    min={today.toISOString().split('T')[0]}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    min={checkInDate}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Adults (18+)
                  </label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-gold/50"
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults</option>
                    <option value={3}>3 Adults</option>
                    <option value={4}>4 Adults</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Children (0-17)
                  </label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-gold/50"
                  >
                    <option value={0}>0 Children</option>
                    <option value={1}>1 Child</option>
                    <option value={2}>2 Children</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Selected stay length: <strong>{nights} Night{nights > 1 ? 's' : ''}</strong></span>
                <span className="text-emerald-700 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real-time availability confirmed directly with hotel inventory</span>
                </span>
              </div>
            </div>

            {/* Available Rooms List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  Available Rooms & Suites
                </h3>
                <span className="text-xs text-stone-500 font-medium">
                  {availableRooms.filter(r => r.availableRoomsCount > 0).length} Suite categories available
                </span>
              </div>

              {loadingAvailability ? (
                <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-400">
                  Checking live room availability...
                </div>
              ) : (
                <div className="space-y-6">
                  {availableRooms.map((room) => {
                    const isAvailable = room.availableRoomsCount > 0;
                    const isSelected = selectedRoom?.roomTypeId === room.roomTypeId;
                    const stayTotal = (room.basePrice * nights) * 1.25; // with taxes

                    return (
                      <div
                        key={room.roomTypeId}
                        className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                          isSelected
                            ? 'border-gold ring-2 ring-gold/40 shadow-lg'
                            : isAvailable
                            ? 'border-stone-200 hover:border-stone-300 shadow-xs'
                            : 'border-stone-200 opacity-60 bg-stone-50/50'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12">
                          {/* Image */}
                          <div className="md:col-span-4 relative h-60 md:h-auto min-h-[220px] overflow-hidden bg-stone-100">
                            <img
                              src={room.images?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'}
                              alt={room.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded">
                              {room.mealPlan}
                            </div>
                          </div>

                          {/* Room Details */}
                          <div className="md:col-span-8 p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                                <div className="flex items-center space-x-3">
                                  <span className="flex items-center space-x-1">
                                    <Users className="w-3.5 h-3.5 text-stone-400" />
                                    <span>Up to {room.maxAdults} Adults</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Bed className="w-3.5 h-3.5 text-stone-400" />
                                    <span>{room.bedType}</span>
                                  </span>
                                </div>

                                {isAvailable ? (
                                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {room.availableRoomsCount} Room{room.availableRoomsCount > 1 ? 's' : ''} Left
                                  </span>
                                ) : (
                                  <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    Sold Out for Selected Dates
                                  </span>
                                )}
                              </div>

                              <h4 className="font-serif text-xl font-bold text-stone-900 mb-1">
                                {room.name}
                              </h4>
                              <p className="text-xs text-stone-600 mb-4 leading-relaxed line-clamp-2">
                                {room.shortDescription}
                              </p>

                              {/* Amenities */}
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {room.amenities?.slice(0, 4).map((a: string) => (
                                  <span key={a} className="bg-stone-100 text-stone-700 text-[11px] px-2 py-0.5 rounded">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Pricing & CTA */}
                            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-baseline space-x-1">
                                  <span className="font-serif text-xl font-bold text-stone-900">
                                    {formatPrice(room.basePrice)}
                                  </span>
                                  <span className="text-xs text-stone-500">/ night</span>
                                </div>
                                <span className="text-xs text-stone-500 font-medium">
                                  Total for {nights} Night{nights > 1 ? 's' : ''}: <strong>{formatPrice(stayTotal)}</strong> (incl. taxes)
                                </span>
                              </div>

                              {isAvailable ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRoom(room);
                                    setStep(2);
                                  }}
                                  className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
                                    isSelected
                                      ? 'bg-emerald-700 text-white shadow-sm'
                                      : 'bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 shadow-xs'
                                  }`}
                                >
                                  <span>{isSelected ? 'Selected' : 'Select Room'}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-stone-200 text-stone-400 cursor-not-allowed"
                                >
                                  Unavailable
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: GUEST DETAILS */}
        {/* ========================================================================= */}
        {step === 2 && selectedRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Guest Details Form */}
            <div className="lg:col-span-8 bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                Guest Information & Preferences
              </h2>
              <p className="text-xs text-stone-500 mb-6">
                Please provide primary guest identification details matching your government photo ID or passport.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abebe"
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kebede"
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Email Address (For Voucher & Itinerary) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="guest@example.com"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+251 91 123 4567"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Country / Nationality
                    </label>
                    <input
                      type="text"
                      value={guestInfo.nationality}
                      onChange={(e) => setGuestInfo({ ...guestInfo, nationality: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Estimated Arrival Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                      <input
                        type="time"
                        value={guestInfo.arrivalTime}
                        onChange={(e) => setGuestInfo({ ...guestInfo, arrivalTime: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. High floor, quiet room, late check-in, complimentary airport shuttle pickup details"
                    value={guestInfo.specialRequests}
                    onChange={(e) => setGuestInfo({ ...guestInfo, specialRequests: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                  />
                  <span className="text-[11px] text-stone-400">Special requests are subject to availability upon check-in.</span>
                </div>

                <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center space-x-1.5 text-stone-600 hover:text-stone-900 text-xs font-bold uppercase tracking-wider py-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Room Selection</span>
                  </button>

                  <button
                    type="submit"
                    className="bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4 text-gold" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Stay Summary Card */}
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm sticky top-24 space-y-4">
                <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
                  Stay Summary
                </h3>

                <div className="flex space-x-3">
                  <img
                    src={selectedRoom.images?.[0]}
                    alt={selectedRoom.name}
                    className="w-20 h-20 rounded-lg object-cover bg-stone-100 shrink-0"
                  />
                  <div>
                    <h4 className="font-serif font-bold text-stone-900 text-sm leading-snug">
                      {selectedRoom.name}
                    </h4>
                    <span className="text-xs text-stone-500 block mt-1">{selectedRoom.bedType}</span>
                    <span className="text-[11px] text-gold-dark font-medium block">{selectedRoom.mealPlan}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-stone-100 pt-3">
                  <div className="flex justify-between text-stone-600">
                    <span>Check-in:</span>
                    <span className="font-semibold text-stone-900">{checkInDate} (14:00)</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Check-out:</span>
                    <span className="font-semibold text-stone-900">{checkOutDate} (11:00)</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Total Length:</span>
                    <span className="font-semibold text-stone-900">{nights} Night{nights > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Guests:</span>
                    <span className="font-semibold text-stone-900">{adults} Adult{adults > 1 ? 's' : ''} {children > 0 ? `, ${children} Child` : ''}</span>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Room Rate:</span>
                    <span>{formatPrice(selectedRoom.basePrice)} × {nights}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span>{formatPrice(pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>VAT (15%):</span>
                    <span>{formatPrice(pricing.tax)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Service Charge (10%):</span>
                    <span>{formatPrice(pricing.serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-100">
                    <span>Total Stay:</span>
                    <span className="font-serif text-lg text-stone-900">{formatPrice(pricing.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: PAYMENT & CONFIRMATION */}
        {/* ========================================================================= */}
        {step === 3 && selectedRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                Select Payment Method
              </h2>
              <p className="text-xs text-stone-500 mb-6">
                Choose how you would like to guarantee and pay for your stay.
              </p>

              <div className="space-y-3 mb-8">
                {/* Pay at Hotel */}
                <label
                  className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'PAY_AT_HOTEL'
                      ? 'border-gold bg-amber-50/30 ring-1 ring-gold'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="PAY_AT_HOTEL"
                    checked={paymentMethod === 'PAY_AT_HOTEL'}
                    onChange={() => setPaymentMethod('PAY_AT_HOTEL')}
                    className="mt-1 text-gold focus:ring-gold"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-stone-700" />
                      <span className="font-bold text-sm text-stone-900">Pay at Hotel Front Desk</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-semibold uppercase">
                        Flexible
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      No upfront charge today. Settle your balance with cash, local card, or mobile money upon arrival.
                    </p>
                  </div>
                </label>

                {/* Chapa Payment */}
                <label
                  className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'CHAPA'
                      ? 'border-gold bg-amber-50/30 ring-1 ring-gold'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="CHAPA"
                    checked={paymentMethod === 'CHAPA'}
                    onChange={() => setPaymentMethod('CHAPA')}
                    className="mt-1 text-gold focus:ring-gold"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-sm text-stone-900">Chapa (Ethiopian Cards & Mobile Money)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold uppercase">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Instant online checkout supporting CBE Birr, Awash Birr, Telebirr, and international cards.
                    </p>
                  </div>
                </label>

                {/* Telebirr */}
                <label
                  className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'TELEBIRR'
                      ? 'border-gold bg-amber-50/30 ring-1 ring-gold'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="TELEBIRR"
                    checked={paymentMethod === 'TELEBIRR'}
                    onChange={() => setPaymentMethod('TELEBIRR')}
                    className="mt-1 text-gold focus:ring-gold"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-sm text-stone-900">Telebirr Mobile Payment</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Fast mobile money transfer directly via Ethio Telecom Telebirr superapp.
                    </p>
                  </div>
                </label>

                {/* Credit Card */}
                <label
                  className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'border-gold bg-amber-50/30 ring-1 ring-gold'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="CREDIT_CARD"
                    checked={paymentMethod === 'CREDIT_CARD'}
                    onChange={() => setPaymentMethod('CREDIT_CARD')}
                    className="mt-1 text-gold focus:ring-gold"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-sm text-stone-900">Credit / Debit Card (Visa, Mastercard, Amex)</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Direct end-to-end 256-bit encrypted card verification.
                    </p>
                  </div>
                </label>
              </div>

              {/* Review Guest Info */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-6 text-xs space-y-1">
                <span className="font-bold text-stone-700 uppercase tracking-wider block mb-1">Reservation Contact</span>
                <p><strong>Guest:</strong> {guestInfo.firstName} {guestInfo.lastName}</p>
                <p><strong>Email:</strong> {guestInfo.email}</p>
                <p><strong>Phone:</strong> {guestInfo.phone}</p>
                {guestInfo.specialRequests && <p><strong>Requests:</strong> {guestInfo.specialRequests}</p>}
              </div>

              {/* Security Note */}
              <div className="flex items-center space-x-2 text-xs text-stone-500 mb-6">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your booking is guaranteed and immediately synchronized with the hotel PMS inventory.</span>
              </div>

              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center space-x-1.5 text-stone-600 hover:text-stone-900 text-xs font-bold uppercase tracking-wider py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Modify Guest Info</span>
                </button>

                <button
                  type="button"
                  disabled={submittingBooking}
                  onClick={handleSubmitBooking}
                  className="bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {submittingBooking ? (
                    <span>{paymentMethod === 'CHAPA' ? 'Redirecting to Chapa...' : 'Confirming Reservation...'}</span>
                  ) : paymentMethod === 'CHAPA' ? (
                    <>
                      <span>Pay ETB {pricing.total.toLocaleString()} with Chapa</span>
                      <ArrowRight className="w-4 h-4 text-gold" />
                    </>
                  ) : (
                    <>
                      <span>Complete Reservation</span>
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Stay Summary Card */}
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm sticky top-24 space-y-4">
                <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
                  Final Review
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Suite:</span>
                    <span className="font-bold text-stone-900">{selectedRoom.name}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Dates:</span>
                    <span className="font-semibold text-stone-900">{checkInDate} → {checkOutDate}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Nights:</span>
                    <span className="font-semibold text-stone-900">{nights}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Payment Mode:</span>
                    <span className="font-semibold text-stone-900 uppercase">{paymentMethod.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span>{formatPrice(pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>VAT & Taxes (15%):</span>
                    <span>{formatPrice(pricing.tax)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Service Charge (10%):</span>
                    <span>{formatPrice(pricing.serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-stone-900 pt-3 border-t border-stone-100">
                    <span>Total:</span>
                    <span className="font-serif text-xl text-stone-900">{formatPrice(pricing.total)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500 pt-1">
                    <span>Due Now:</span>
                    <span className="font-semibold text-stone-800">
                      {paymentMethod === 'PAY_AT_HOTEL' ? 'ETB 0.00 (Pay at Check-in)' : formatPrice(pricing.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
