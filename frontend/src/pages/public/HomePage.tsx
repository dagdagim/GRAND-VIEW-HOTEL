import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Bed, 
  ArrowRight, 
  Star, 
  Shield, 
  Utensils, 
  Waves, 
  Sparkles, 
  Car, 
  Wifi, 
  Clock, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  // Booking widget state
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 2);

  const [checkInDate, setCheckInDate] = useState<string>(today.toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrow.toISOString().split('T')[0]);
  const [guests, setGuests] = useState<number>(2);

  // Room types from API
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/public/rooms');
        setFeaturedRooms(res.data.roomTypes || []);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  const handleCheckAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/booking?checkIn=${checkInDate}&checkOut=${checkOutDate}&guests=${guests}`);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-stone-950 text-white overflow-hidden">
        {/* Background Image with elegant overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85"
            alt="Grand View Hotel Luxury Facade"
            className="w-full h-full object-cover object-center opacity-45 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/30"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center space-x-2 bg-gold/10 border border-gold/40 text-gold-light text-xs font-semibold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full mb-6 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Addis Ababa's Premier Luxury Sanctuary</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-tight mb-6">
            Your stay, <br className="hidden sm:inline" />
            <span className="italic font-normal text-gold-light">thoughtfully made.</span>
          </h1>

          <p className="text-stone-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Experience bespoke comfort, authentic Ethiopian hospitality, and breathtaking views of the capital from the heart of the Bole diplomatic corridor.
          </p>

          {/* INTEGRATED BOOKING WIDGET */}
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-6 border border-stone-200 text-stone-900 text-left">
            <form onSubmit={handleCheckAvailability} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Check-In */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Check-In
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="date"
                    required
                    min={today.toISOString().split('T')[0]}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
              </div>

              {/* Check-Out */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Check-Out
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="date"
                    required
                    min={checkInDate}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Guests
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults</option>
                    <option value={3}>3 Adults</option>
                    <option value={4}>4 Adults</option>
                    <option value={5}>5+ Guests (Suite)</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg"
                >
                  <span>Check Availability</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. FEATURED ROOMS & SUITES */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] block mb-2">
            Refined Living Spaces
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
            Rooms & Diplomatic Suites
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Every room blends bespoke artisan woodwork with contemporary amenities, plush Egyptian cotton linens, and panoramic skyline vistas.
          </p>
        </div>

        {loadingRooms ? (
          <div className="text-center py-12 text-stone-400">Loading available luxury suites...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredRooms.slice(0, 6).map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden bg-stone-100">
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded border border-stone-700">
                    {room.mealPlan}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span>Up to {room.maxOccupancy} Guests</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Bed className="w-3.5 h-3.5 text-stone-400" />
                        <span>{room.bedType}</span>
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-gold transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {room.shortDescription}
                    </p>

                    {/* Amenity tags */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {room.amenities?.slice(0, 3).map((a: string) => (
                        <span
                          key={a}
                          className="bg-stone-100 text-stone-600 text-[11px] px-2 py-0.5 rounded font-medium"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Select CTA */}
                  <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                        Starting from
                      </span>
                      <span className="text-lg font-bold text-stone-900 font-serif">
                        {formatPrice(room.basePrice)}
                      </span>
                      <span className="text-xs text-stone-500"> / night</span>
                    </div>

                    <Link
                      to={`/booking?roomType=${room._id}&checkIn=${checkInDate}&checkOut=${checkOutDate}&guests=${guests}`}
                      className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-xs"
                    >
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gold" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/rooms"
            className="inline-flex items-center space-x-2 text-stone-900 hover:text-gold text-sm font-semibold tracking-wider uppercase border-b-2 border-stone-900 hover:border-gold pb-1 transition-all"
          >
            <span>Explore All 6 Room & Suite Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 3. WHY CHOOSE GRAND VIEW */}
      <section className="py-20 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] block mb-2">
              The Grand View Standard
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Stay With Us
            </h2>
            <p className="text-sm text-stone-400">
              A curated experience tailored for high-ranking diplomats, corporate leaders, and refined leisure travelers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-stone-800/60 border border-stone-700/60 p-6 rounded-xl hover:border-gold/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold mb-5">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-white mb-2">Diplomatic Security</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                24/7 dedicated surveillance, secure elevator floor access, and private vehicle escorts for peace of mind.
              </p>
            </div>

            <div className="bg-stone-800/60 border border-stone-700/60 p-6 rounded-xl hover:border-gold/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold mb-5">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-white mb-2">Culinary Distinction</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Authentic Ethiopian clay-pot delicacies and prime international dining, available round-the-clock for room service.
              </p>
            </div>

            <div className="bg-stone-800/60 border border-stone-700/60 p-6 rounded-xl hover:border-gold/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold mb-5">
                <Waves className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-white mb-2">Wellness & Spa</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Heated rooftop infinity pool overlooking Mount Entoto, botanical Finnish saunas, and rejuvenating holistic massage therapies.
              </p>
            </div>

            <div className="bg-stone-800/60 border border-stone-700/60 p-6 rounded-xl hover:border-gold/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold mb-5">
                <Car className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-white mb-2">Seamless Airport Transit</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Complimentary luxury shuttle every 30 minutes to and from Bole International Airport terminals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GUEST REVIEWS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] block mb-2">
            Verified Experiences
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-3">
            Words from Our Guests
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-700 italic leading-relaxed">
                "The Presidential Suite was unmatched. From the private butler service to the panoramic rooftop views of Addis Ababa, everything was impeccably executed."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <span className="block font-serif font-bold text-stone-900 text-sm">H.E. Fatoumata Diallo</span>
              <span className="block text-[11px] text-stone-500">Diplomatic Envoy, African Union</span>
            </div>
          </div>

          <div className="bg-white p-7 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-700 italic leading-relaxed">
                "Online booking was seamless and instant. Checked in without delay, and the traditional coffee ceremony in the lobby was the best welcome after an international flight."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <span className="block font-serif font-bold text-stone-900 text-sm">Jean-Luc Dupont</span>
              <span className="block text-[11px] text-stone-500">Senior Director, TotalEnergies</span>
            </div>
          </div>

          <div className="bg-white p-7 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-700 italic leading-relaxed">
                "As a regular business traveler to Bole, Grand View has become my home away from home. The high-speed fiber Wi-Fi and executive lounge are top notch."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <span className="block font-serif font-bold text-stone-900 text-sm">Abebe Kebede</span>
              <span className="block text-[11px] text-stone-500">Executive VP, Ethiopian Aviation</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LOCATION & CONTACT BANNER */}
      <section className="bg-stone-100 py-16 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] block mb-2">
              Unrivaled Central Location
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900 mb-4">
              Minutes from Bole Airport & Diplomatic Quarters
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed mb-6">
              Located on Cameroon Street in the Bole International Airport corridor, Grand View Hotel places you within 5 minutes of international terminals, foreign embassies, and the UNECA convention center.
            </p>
            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>5 minutes to Bole International Airport (Terminal 1 & 2)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>10 minutes to African Union Headquarters</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Complimentary 24/7 airport transfers for all direct bookings</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h4 className="font-serif text-lg font-bold text-stone-900 mb-2">Reserve Your Experience</h4>
            <p className="text-xs text-stone-500 mb-4">
              Our reservation concierge is on standby 24 hours a day to assist with custom room requirements, diplomatic security, or banqueting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/booking"
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-gold-light py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider text-center border border-gold/40 transition-colors shadow-xs"
              >
                Book Online Now
              </Link>
              <Link
                to="/contact"
                className="flex-1 bg-stone-50 hover:bg-stone-100 text-stone-800 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider text-center border border-stone-300 transition-colors"
              >
                Contact Concierge
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
