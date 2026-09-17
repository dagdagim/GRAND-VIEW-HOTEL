import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Shield, Menu, X, Phone, Globe } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Rooms & Suites', path: '/rooms' },
    { name: 'Amenities', path: '/amenities' },
    { name: 'Dining', path: '/amenities#dining' },
    { name: 'Special Offers', path: '/offers' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      {/* Top micro bar for phone, currency, and PMS portal */}
      <div className="bg-stone-900 text-stone-300 text-xs py-1.5 px-4 sm:px-8 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-gold" />
              <span>+251 11 667 8000</span>
            </span>
            <span className="hidden md:inline text-stone-500">|</span>
            <span className="hidden md:inline text-stone-400">Cameroon St, Bole, Addis Ababa</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Currency Selector */}
            <div className="flex items-center space-x-1">
              <Globe className="w-3 h-3 text-stone-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="bg-stone-800 text-stone-200 text-xs rounded px-1.5 py-0.5 border border-stone-700 focus:outline-none focus:border-gold"
              >
                <option value="ETB">ETB (Br)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <Link
              to="/pms/dashboard"
              className="flex items-center space-x-1 text-gold hover:text-gold-light transition-colors font-medium border-l border-stone-700 pl-3"
            >
              <Shield className="w-3 h-3" />
              <span>Hotel PMS</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full bg-stone-900 border border-gold flex items-center justify-center text-gold font-serif font-bold text-xl shadow-xs group-hover:bg-stone-800 transition-colors">
            G
          </div>
          <div>
            <span className="block font-serif text-xl tracking-wider font-semibold text-stone-900 group-hover:text-gold transition-colors">
              GRAND VIEW
            </span>
            <span className="block text-[10px] tracking-[0.25em] uppercase text-stone-500 -mt-1 font-medium">
              Hotel & Suites
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-7">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-gold ${
                isActive(link.path)
                  ? 'text-stone-900 font-semibold border-b-2 border-gold pb-0.5'
                  : 'text-stone-600'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Primary CTA */}
        <div className="hidden sm:flex items-center space-x-3">
          <Link
            to="/booking"
            className="inline-flex items-center space-x-2 bg-stone-900 hover:bg-stone-800 text-gold-light px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide border border-gold/40 shadow-xs hover:border-gold transition-all"
          >
            <Calendar className="w-4 h-4 text-gold" />
            <span>BOOK YOUR STAY</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-stone-700 hover:text-stone-900"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-6 py-5 space-y-4 shadow-lg">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-1.5 ${
                  isActive(link.path) ? 'text-gold font-bold' : 'text-stone-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-stone-100 flex flex-col space-y-2">
            <Link
              to="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-stone-900 text-gold-light py-2.5 rounded-lg font-semibold text-sm border border-gold/40"
            >
              BOOK YOUR STAY
            </Link>
            <Link
              to="/pms/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Access Hotel PMS Staff Portal →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
