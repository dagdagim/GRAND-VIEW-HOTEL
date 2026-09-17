import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand & Mission */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold flex items-center justify-center text-gold font-serif font-bold text-lg">
              G
            </div>
            <div>
              <span className="block font-serif text-lg tracking-wider font-semibold text-white">
                GRAND VIEW
              </span>
              <span className="block text-[9px] tracking-[0.25em] uppercase text-stone-400 font-medium">
                Hotel & Suites
              </span>
            </div>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            "Your stay, thoughtfully made." Located in the diplomatic corridor of Bole, Addis Ababa, offering unparalleled luxury, authentic hospitality, and panoramic mountain skylines.
          </p>
          <div className="flex items-center space-x-3 pt-2 text-gold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-stone-300 font-medium">Certified 5-Star Commercial Hospitality</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif text-white text-sm font-semibold tracking-wider uppercase mb-4">
            Navigation
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/rooms" className="hover:text-gold transition-colors">Rooms & Executive Suites</Link></li>
            <li><Link to="/booking" className="hover:text-gold transition-colors">Online Booking Engine</Link></li>
            <li><Link to="/amenities" className="hover:text-gold transition-colors">Wellness, Spa & Dining</Link></li>
            <li><Link to="/offers" className="hover:text-gold transition-colors">Exclusive Packages & Offers</Link></li>
            <li><Link to="/about" className="hover:text-gold transition-colors">Our Story & Heritage</Link></li>
            <li><Link to="/contact" className="hover:text-gold transition-colors">Contact & Directions</Link></li>
          </ul>
        </div>

        {/* Policies & Operations */}
        <div>
          <h4 className="font-serif text-white text-sm font-semibold tracking-wider uppercase mb-4">
            Guest Information
          </h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-gold" />
              <span>Check-in: 14:00 | Check-out: 11:00</span>
            </li>
            <li>Free cancellation up to 48 hours prior</li>
            <li>Complimentary Airport Shuttle (Every 30m)</li>
            <li>Valet & Underground Parking Included</li>
            <li>High-Speed Wi-Fi 6 Throughout Property</li>
            <li>All major cards & Ethiopian mobile money accepted</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-serif text-white text-sm font-semibold tracking-wider uppercase mb-4">
            Contact & Location
          </h4>
          <div className="space-y-3 text-xs text-stone-400">
            <div className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span>Cameroon Street, Bole Sub-City, Addis Ababa, Ethiopia</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Phone className="w-4 h-4 text-gold shrink-0" />
              <span>+251 11 667 8000</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Mail className="w-4 h-4 text-gold shrink-0" />
              <span>reservations@grandviewhotel.com</span>
            </div>
            <div className="pt-2">
              <Link
                to="/pms/dashboard"
                className="inline-block text-[11px] font-semibold text-gold hover:text-gold-light underline underline-offset-4"
              >
                Staff Access & Administration Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-12 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500">
        <p>© {new Date().getFullYear()} Grand View Hospitality PLC. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 flex items-center space-x-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-gold inline" />
          <span>for luxury hospitality management.</span>
        </p>
      </div>
    </footer>
  );
};
