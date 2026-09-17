import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bed, Maximize, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const RoomsPage: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/public/rooms');
        setRoomTypes(res.data.roomTypes || []);
      } catch (e) {
        console.error('Error fetching room types', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const categories = ['ALL', 'Single', 'Double', 'Twin', 'Deluxe', 'Suite', 'Presidential'];

  const filteredRooms = selectedCategory === 'ALL'
    ? roomTypes
    : roomTypes.filter(r => r.category === selectedCategory);

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-gold uppercase tracking-[0.25em] block mb-2">
            Sanctuary & Comfort
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
            Rooms & Luxury Suites
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Every residence at Grand View Hotel & Suites is thoughtfully designed with handcrafted Ethiopian hardwoods, soundproof floor-to-ceiling windows, and luxury Italian marble en-suites.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-gold-light shadow-sm border border-gold/40'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat === 'ALL' ? 'All Rooms' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="text-center py-20 text-stone-400">Loading residences...</div>
        ) : (
          <div className="space-y-10">
            {filteredRooms.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Image Section */}
                <div className="lg:col-span-5 relative h-72 lg:h-auto min-h-[300px] overflow-hidden bg-stone-100">
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-md border border-stone-700 uppercase tracking-wider">
                    {room.category}
                  </div>
                </div>

                {/* Details Section */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mb-3">
                      <span className="flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-stone-400" />
                        <span>Max {room.maxOccupancy} Guests</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <Bed className="w-4 h-4 text-stone-400" />
                        <span>{room.bedType}</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <Maximize className="w-4 h-4 text-stone-400" />
                        <span>{room.sizeSquareMeters} m² / {Math.round(room.sizeSquareMeters * 10.764)} sq ft</span>
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
                      {room.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6 font-light">
                      {room.description}
                    </p>

                    {/* Amenities List */}
                    <div className="mb-6">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                        Included Amenities & Privileges
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {room.amenities?.map((amenity: string) => (
                          <div key={amenity} className="flex items-center space-x-1.5 text-xs text-stone-700">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Bar and Book Action */}
                  <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                        Daily Room Rate ({room.mealPlan})
                      </span>
                      <div className="flex items-baseline space-x-1">
                        <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                          {formatPrice(room.basePrice)}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">/ night + taxes</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
                        {room.cancellationPolicy}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/booking?roomType=${room._id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
                      >
                        <span>Reserve Suite</span>
                        <ArrowRight className="w-4 h-4 text-gold" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
