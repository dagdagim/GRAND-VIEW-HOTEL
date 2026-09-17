import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, ArrowRight, Check } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const OffersPage: React.FC = () => {
  const { formatPrice } = useCurrency();

  const offers = [
    {
      title: 'Diplomatic Long-Stay Privilege',
      discount: '15% OFF Extended Stays (7+ Nights)',
      description: 'Designed for international envoys, consultants, and embassy officials. Includes executive laundry, club lounge meeting room access, and private airport limousine transfer.',
      code: 'DIPLOMAT2026',
      perks: [
        'Complimentary Daily Executive Club Breakfast',
        'Daily Laundry & Pressing Service (Up to 3 items)',
        'Private 4-Person Meeting Room (2 hrs daily)',
        'Guaranteed Early Check-in & Late 16:00 Checkout'
      ],
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Weekend Skyline Retreat',
      discount: 'Complimentary Dinner & Spa Credit',
      description: 'Escape the city rush. Enjoy Friday to Sunday luxury in our Deluxe King Suite with complimentary 3-course dinner for two at Abyssinia and 60-minute botanical massage.',
      code: 'WEEKENDRETREAT',
      perks: [
        '3-Course Chef Tasting Dinner at Abyssinia',
        'ETB 2,500 Botanical Spa Treatment Voucher',
        'Chilled Ethiopian Rift Valley Wine on Arrival',
        'Complimentary Rooftop Infinity Pool Cabana'
      ],
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Corporate Transit Special',
      discount: 'Seamless Overnight Transit Experience',
      description: 'Ideal for passengers connecting through Ethiopian Airlines Bole hub. Express check-in, 24/7 baggage care, and instant airport shuttle connectivity.',
      code: 'TRANSITBOLE',
      perks: [
        '24-Hour Flexible Check-in / Check-out',
        'Direct Terminal Shuttle every 30 minutes',
        'Express Continental Breakfast from 04:00 AM',
        'High-Speed Wi-Fi 6 for remote productivity'
      ],
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-gold uppercase tracking-[0.25em] block mb-2">
            Curated Experiences
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
            Exclusive Packages & Offers
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed font-light">
            Take advantage of special seasonal rates and luxury packages crafted to elevate your stay in Addis Ababa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {offers.map((offer) => (
            <div
              key={offer.title}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 bg-stone-100 overflow-hidden">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-stone-900/90 text-gold-light border border-gold/40 text-xs font-bold px-3 py-1 rounded">
                    Promo: {offer.code}
                  </div>
                </div>

                <div className="p-6">
                  <span className="text-xs font-bold text-gold-dark uppercase tracking-wider block mb-1">
                    {offer.discount}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-3">
                    {offer.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-6 font-light">
                    {offer.description}
                  </p>

                  <div className="space-y-2 border-t border-stone-100 pt-4">
                    {offer.perks.map((p) => (
                      <div key={p} className="flex items-start space-x-2 text-xs text-stone-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-stone-100 mt-6">
                <Link
                  to={`/booking?promo=${offer.code}`}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  <span>Book This Package</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gold" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
