import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Printer, 
  Download, 
  Calendar, 
  Users, 
  Bed, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ArrowLeft,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const BookingConfirmationPage: React.FC = () => {
  const { bookingNumber } = useParams<{ bookingNumber: string }>();
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();

  const chapaTxRef = searchParams.get('chapa_tx_ref') || searchParams.get('tx_ref') || searchParams.get('trx_ref') || searchParams.get('reference');
  const [chapaVerified, setChapaVerified] = useState<boolean>(false);
  const [verifyingChapa, setVerifyingChapa] = useState<boolean>(false);
  const [initiatingChapa, setInitiatingChapa] = useState<boolean>(false);

  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndVerify = async () => {
    // 1. Fetch reservation details immediately to unblock UI rendering instantly
    if (bookingNumber) {
      try {
        const res = await api.get(`/public/booking/${bookingNumber}`);
        setBooking(res.data.reservation);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to retrieve reservation details.');
        setLoading(false);
        return;
      }
    }

    // 2. Concurrently verify payment with Chapa in background if returning with tx_ref
    const refToVerify = chapaTxRef;
    if (refToVerify) {
      setVerifyingChapa(true);
      try {
        const verifyRes = await api.get(`/public/chapa/verify/${refToVerify}`, { timeout: 8000 });
        if (verifyRes.data?.verified) {
          setChapaVerified(true);
          if (verifyRes.data?.reservation) {
            setBooking(verifyRes.data.reservation);
          } else if (bookingNumber) {
            const refreshed = await api.get(`/public/booking/${bookingNumber}`);
            setBooking(refreshed.data.reservation);
          }
        }
      } catch (e) {
        console.warn('Chapa verification warning:', e);
      } finally {
        setVerifyingChapa(false);
      }
    } else if (bookingNumber) {
      // Auto-check if booking is pending and has a reference
      try {
        const checkRes = await api.get(`/public/booking/${bookingNumber}`);
        const r = checkRes.data.reservation;
        if (r?.paymentMethod === 'CHAPA' && r?.paymentStatus === 'PENDING' && r?.paymentGatewayReference) {
          const backgroundVerify = await api.get(`/public/chapa/verify/${r.paymentGatewayReference}`);
          if (backgroundVerify.data?.verified) {
            setChapaVerified(true);
            const refreshed = await api.get(`/public/booking/${bookingNumber}`);
            setBooking(refreshed.data.reservation);
          }
        }
      } catch (_) {}
    }
  };

  useEffect(() => {
    fetchAndVerify();
  }, [bookingNumber, chapaTxRef]);

  const handlePayWithChapa = async () => {
    if (!booking) return;
    setInitiatingChapa(true);
    try {
      const res = await api.post('/public/chapa/initialize', {
        reservationId: booking._id,
        folioId: booking.folio?._id || booking.folio || undefined,
        clientUrl: window.location.origin,
        amount: booking.pricing?.total,
        email: booking.guest?.email,
        firstName: booking.guest?.firstName,
        lastName: booking.guest?.lastName,
        phone: booking.guest?.phone,
        returnUrl: `${window.location.origin}/booking/confirmation/${booking.bookingNumber}?chapa_status=success`
      });

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        alert('Could not generate Chapa checkout URL. Please try again.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initialize Chapa payment session.');
    } finally {
      setInitiatingChapa(false);
    }
  };

  const handleVerifyNow = async () => {
    const ref = chapaTxRef || booking?.paymentGatewayReference;
    if (!ref) {
      alert('No Chapa transaction reference found to verify.');
      return;
    }
    setVerifyingChapa(true);
    try {
      const verifyRes = await api.get(`/public/chapa/verify/${ref}`);
      if (verifyRes.data?.verified) {
        setChapaVerified(true);
        const res = await api.get(`/public/booking/${bookingNumber}`);
        setBooking(res.data.reservation);
      } else {
        alert(verifyRes.data?.message || 'Payment has not been confirmed by Chapa yet.');
      }
    } catch (e: any) {
      alert(e.response?.data?.error || 'Could not verify payment with Chapa.');
    } finally {
      setVerifyingChapa(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-stone-500">
        Retrieving official booking voucher...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Reservation Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">{error || 'Could not locate booking record.'}</p>
        <Link
          to="/"
          className="bg-stone-900 text-gold-light px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const checkInFormatted = new Date(booking.checkInDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const checkOutFormatted = new Date(booking.checkOutDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Pending Chapa Payment Banner (When guest needs to pay or verify) */}
        {booking.paymentMethod === 'CHAPA' && booking.paymentStatus === 'PENDING' && !chapaVerified ? (
          <div className="no-print bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-6 text-amber-950 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-200/70 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                  <RefreshCw className={`w-5 h-5 ${verifyingChapa ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-amber-950">Awaiting Chapa Payment Confirmation</h2>
                  <p className="text-xs text-amber-800 mt-1">
                    Booking #{booking.bookingNumber} is registered. Please complete your transaction of <strong>{formatPrice(booking.pricing?.total || 0)}</strong> via Chapa to finalize and confirm your stay.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
                <button
                  onClick={handlePayWithChapa}
                  disabled={initiatingChapa}
                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{initiatingChapa ? 'Connecting to Chapa...' : 'Pay Now via Chapa'}</span>
                </button>

                <button
                  onClick={handleVerifyNow}
                  disabled={verifyingChapa}
                  className="inline-flex items-center space-x-1.5 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingChapa ? 'animate-spin' : ''}`} />
                  <span>{verifyingChapa ? 'Checking...' : 'Verify Status'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Success Alert Banner (Hidden when printing) */
          <div className="no-print bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-900 shadow-sm flex items-start space-x-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold">Booking Confirmed!</h1>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Thank you, <strong>{booking.guest?.fullName || `${booking.guest?.firstName} ${booking.guest?.lastName}`}</strong>. Your reservation has been guaranteed and dispatched directly into the Hotel Management System.
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handlePrint}
                className="inline-flex items-center space-x-1.5 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        )}

        {/* Chapa Payment Verification Status */}
        {verifyingChapa && (
          <div className="no-print bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center space-x-2.5">
            <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            <span>Verifying real-time transaction with Chapa payment gateway...</span>
          </div>
        )}

        {(chapaVerified || (booking.paymentMethod === 'CHAPA' && booking.paymentStatus === 'PAID')) && (
          <div className="no-print bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 text-xs text-emerald-950 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">Payment Confirmed via Chapa Gateway</span>
                <span className="text-[11px] text-emerald-700">
                  Transaction ref: {booking.paymentGatewayReference || chapaTxRef || 'CHAPA-AUTH'}
                </span>
              </div>
            </div>
            <span className="bg-emerald-200/80 text-emerald-950 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider">
              Test Verified
            </span>
          </div>
        )}

        {/* OFFICIAL RESERVATION VOUCHER CARD (Optimized for Screen & Print) */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden p-8 sm:p-10 text-stone-900">
          {/* Voucher Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-stone-200 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-stone-900 border border-gold flex items-center justify-center text-gold font-serif font-bold text-2xl">
                G
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-wide text-stone-900 block leading-tight">
                  GRAND VIEW
                </span>
                <span className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-semibold block">
                  Hotel & Suites • Addis Ababa
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Booking Reference #
              </span>
              <span className="font-serif text-2xl font-bold text-stone-900 tracking-wider">
                #{booking.bookingNumber}
              </span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {booking.status}
              </span>
            </div>
          </div>

          {/* Stay Specifics */}
          <div className="py-8 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Guest Name
              </span>
              <span className="text-base font-bold text-stone-900 block">
                {booking.guest?.fullName || `${booking.guest?.firstName} ${booking.guest?.lastName}`}
              </span>
              <span className="text-xs text-stone-500">{booking.guest?.email}</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Check-in Date
              </span>
              <span className="text-base font-bold text-stone-900 block">
                {checkInFormatted}
              </span>
              <span className="text-xs text-stone-500">From 14:00 PM onwards</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Check-out Date
              </span>
              <span className="text-base font-bold text-stone-900 block">
                {checkOutFormatted}
              </span>
              <span className="text-xs text-stone-500">Until 11:00 AM</span>
            </div>
          </div>

          {/* Reserved Accommodation Details */}
          <div className="py-8 border-b border-stone-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
              Accommodation Summary
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50 p-5 rounded-xl border border-stone-200 gap-4">
              <div>
                <h4 className="font-serif text-xl font-bold text-stone-900">
                  {booking.roomType?.name}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-1">
                  <span>{booking.nights} Night{booking.nights > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{booking.adults} Adult{booking.adults > 1 ? 's' : ''} {booking.children > 0 ? `, ${booking.children} Child` : ''}</span>
                  <span>•</span>
                  <span>{booking.roomType?.bedType}</span>
                </div>
                <span className="text-xs text-emerald-700 font-semibold mt-1 block">
                  {booking.roomType?.mealPlan || 'Breakfast Included'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-stone-500 block">Daily Room Rate:</span>
                <span className="text-lg font-bold text-stone-900 font-serif">
                  {formatPrice(booking.pricing?.roomRatePerNight || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-8 border-b border-stone-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
              Payment & Charge Breakdown
            </h3>
            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Room Charges ({booking.nights} Nights):</span>
                <span>{formatPrice(booking.pricing?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Value Added Tax (15% VAT):</span>
                <span>{formatPrice(booking.pricing?.tax || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hospitality Service Charge (10%):</span>
                <span>{formatPrice(booking.pricing?.serviceCharge || 0)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-900 pt-3 border-t border-stone-200">
                <span>Total Stay Amount:</span>
                <span className="font-serif text-2xl text-stone-900">
                  {formatPrice(booking.pricing?.total || 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span>Payment Method & Status:</span>
                <span className="font-semibold text-stone-800 uppercase">
                  {booking.paymentMethod?.replace(/_/g, ' ')} ({booking.paymentStatus})
                </span>
              </div>
            </div>
          </div>

          {/* Hotel Location & Policies Footer */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-stone-500">
            <div>
              <span className="font-bold text-stone-700 uppercase tracking-wider block mb-1">
                Hotel Location & Contact
              </span>
              <p>Cameroon Street, Bole Sub-City, Addis Ababa</p>
              <p>Phone: +251 11 667 8000</p>
              <p>Email: reservations@grandviewhotel.com</p>
            </div>
            <div>
              <span className="font-bold text-stone-700 uppercase tracking-wider block mb-1">
                Arrival Instructions
              </span>
              <p>Valid government photo ID or passport is required upon check-in.</p>
              <p>Complimentary airport shuttle leaves Bole Terminal every 30 minutes.</p>
            </div>
          </div>
        </div>

        {/* Navigation Actions (Hidden when printing) */}
        <div className="no-print flex items-center justify-center pt-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-stone-600 hover:text-stone-900 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Hotel Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
