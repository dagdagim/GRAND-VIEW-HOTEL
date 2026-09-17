import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Waves, Sparkles, Coffee, Dumbbell, Shield, Car, ArrowRight } from 'lucide-react';

export const AmenitiesPage: React.FC = () => {
  const amenitiesList = [
    {
      id: 'dining',
      title: 'Abyssinia Fine Dining & Terrace',
      subtitle: 'Artisanal Ethiopian & Continental Gastronomy',
      description: 'Under the direction of renowned executive chefs, Abyssinia presents slow-simmered regional specialities prepared in authentic volcanic clay pots, alongside prime 28-day aged charcoal-grilled steaks and fresh Lake Tana perch.',
      hours: 'Open Daily: 06:30 - 23:00 (Room Service 24/7)',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      icon: Utensils
    },
    {
      id: 'spa',
      title: 'Zoma Botanical Wellness & Spa',
      subtitle: 'Holistic Ethiopian Botanicals & Finnish Saunas',
      description: 'An urban oasis of serenity. Unwind with aromatherapy body treatments infused with natural frankincense, myrrh, and organic beeswax, followed by Finnish wood saunas and eucalyptus steam baths.',
      hours: 'Open Daily: 08:00 - 21:00',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      icon: Sparkles
    },
    {
      id: 'pool',
      title: 'Heated Rooftop Infinity Pool',
      subtitle: '360° Panoramic Mountain & Skyline Views',
      description: 'Suspended high above Bole with panoramic views of the Entoto mountain range. Enjoy year-round climate-controlled swimming paired with artisan cocktails and sunset tapas from the poolside bar.',
      hours: 'Open Daily: 06:00 - 22:00',
      image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
      icon: Waves
    },
    {
      id: 'lounge',
      title: '24/7 Diplomatic Executive Lounge',
      subtitle: 'Private Meeting Salons & High-Speed Connectivity',
      description: 'Exclusive to Club and Diplomatic Suite residents. Includes private boardroom facilities, complimentary high tea, afternoon hors d’oeuvres, and dedicated concierge secretarial services.',
      hours: 'Open 24 Hours with Keycard Access',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      icon: Coffee
    },
    {
      id: 'fitness',
      title: 'Technogym Fitness Studio',
      subtitle: 'State-of-the-Art Cardio & Functional Training',
      description: 'Equipped with the latest Technogym cardio consoles, free weights, Olympic lifting racks, and certified personal trainers on staff for customized private sessions.',
      hours: 'Open 24 Hours for Hotel Residents',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      icon: Dumbbell
    },
    {
      id: 'transit',
      title: 'Complimentary Airport Limousine Transfer',
      subtitle: 'Seamless Terminal VIP Pick-up',
      description: 'Enjoy effortless door-to-door transit between Bole International Airport and Grand View Hotel. Our fleet of executive vehicles departs every 30 minutes with dedicated baggage assistance.',
      hours: 'Operates 24 Hours / 7 Days a Week',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      icon: Car
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-gold uppercase tracking-[0.25em] block mb-2">
            World-Class Facilities
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
            Hotel Amenities & Dining
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed font-light">
            Every facility at Grand View Hotel & Suites is designed to exceed the exacting standards of diplomats, corporate leaders, and discerning world travelers.
          </p>
        </div>

        <div className="space-y-16">
          {amenitiesList.map((item, idx) => {
            const Icon = item.icon;
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={item.id}
                id={item.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm ${
                  isReversed ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={`lg:col-span-6 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-stone-100 shadow-md">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className={`lg:col-span-6 space-y-4 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-dark block">
                      {item.subtitle}
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                      {item.title}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                    {item.description}
                  </p>
                  <div className="text-xs text-stone-500 font-medium pt-2">
                    🕒 {item.hours}
                  </div>
                  <div className="pt-4">
                    <Link
                      to="/booking"
                      className="inline-flex items-center space-x-2 bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                      <span>Reserve Your Stay</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gold" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
