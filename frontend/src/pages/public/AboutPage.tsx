import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Heart, Sparkles, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-gold uppercase tracking-[0.25em] block mb-2">
            Our Story & Heritage
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
            Thoughtful Hospitality in the Horn of Africa
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed font-light">
            Founded with an enduring passion for authentic Ethiopian grace, Grand View Hotel & Suites blends contemporary architectural elegance with centuries-old traditions of warm welcome.
          </p>
        </div>

        {/* Narrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="relative h-96 sm:h-[480px] rounded-3xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
              alt="Grand View Architecture"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-gold/15 border border-gold/40 text-gold-dark text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Architectural Vision</span>
            </div>

            <h2 className="font-serif text-3xl font-bold text-stone-900 leading-tight">
              A Landmark Designed for Discerning Global Stays
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
              Situated prominently along Cameroon Street in Addis Ababa’s bustling Bole district, Grand View Hotel stands as a symbol of modern Ethiopian hospitality. Our property incorporates locally sourced acacia wood, hand-carved stone masonry, and panoramic double-glazed acoustic glass to insulate our guests in quiet luxury.
            </p>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
              Whether welcoming heads of state for high-level summits, corporate executives on transit, or families exploring the cultural treasures of the National Museum and Entoto Park, our team is committed to making every stay an unforgettable memory.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200">
              <div>
                <span className="font-serif text-3xl font-bold text-stone-900 block">32</span>
                <span className="text-xs text-stone-500">Luxury Residences & Suites</span>
              </div>
              <div>
                <span className="font-serif text-3xl font-bold text-stone-900 block">5★</span>
                <span className="text-xs text-stone-500">Commercial PMS Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Values Banner */}
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-2">Our Guiding Pillars</h3>
            <p className="text-xs text-stone-400 font-light">
              Built on uncompromising standards of service, privacy, and genuine human warmth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-stone-800/60 p-6 rounded-2xl border border-stone-700/60">
              <ShieldCheck className="w-8 h-8 text-gold mb-3" />
              <h4 className="font-serif text-lg font-bold mb-2">Safety & Discretion</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Diplomatic security standards, secure keycard elevator floors, and rigorous data privacy protections.
              </p>
            </div>

            <div className="bg-stone-800/60 p-6 rounded-2xl border border-stone-700/60">
              <Award className="w-8 h-8 text-gold mb-3" />
              <h4 className="font-serif text-lg font-bold mb-2">Precision Operations</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Seamless real-time inventory management, instantaneous billing, and spotless five-stage housekeeping protocols.
              </p>
            </div>

            <div className="bg-stone-800/60 p-6 rounded-2xl border border-stone-700/60">
              <Heart className="w-8 h-8 text-gold mb-3" />
              <h4 className="font-serif text-lg font-bold mb-2">Authentic Warmth</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                From our ceremonial welcoming coffee to personalized concierge attention, you are our esteemed guest.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/booking"
            className="inline-flex items-center space-x-2 bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
          >
            <span>Book Your Stay at Grand View</span>
            <ArrowRight className="w-4 h-4 text-gold" />
          </Link>
        </div>
      </div>
    </div>
  );
};
