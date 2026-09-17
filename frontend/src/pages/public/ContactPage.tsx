import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-gold uppercase tracking-[0.25em] block mb-2">
            Always At Your Service
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
            Contact & Concierge
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed font-light">
            Our 24-hour guest relations team is dedicated to assisting with reservations, special diplomatic requests, airport shuttles, and private event planning.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Contact Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <h3 className="font-serif text-xl font-bold text-stone-900 border-b border-stone-100 pb-3">
                Grand View Hotel & Suites
              </h3>

              <div className="flex items-start space-x-3 text-xs text-stone-600">
                <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block text-sm font-semibold">Physical Location</strong>
                  <span>Cameroon Street, Bole Sub-City (Airport Corridor)</span>
                  <span className="block text-stone-400">Addis Ababa, Ethiopia</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs text-stone-600">
                <Phone className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block text-sm font-semibold">Telephone Inquiries</strong>
                  <span>Reception: +251 11 667 8000</span>
                  <span className="block">Concierge Hotline: +251 91 123 4567</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs text-stone-600">
                <Mail className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block text-sm font-semibold">Electronic Mail</strong>
                  <span>Reservations: reservations@grandviewhotel.com</span>
                  <span className="block">Corporate: concierge@grandviewhotel.com</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs text-stone-600">
                <Clock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block text-sm font-semibold">Operational Hours</strong>
                  <span>Front Desk: 24 Hours / 7 Days a Week</span>
                  <span className="block">Check-in: 14:00 | Check-out: 11:00</span>
                </div>
              </div>
            </div>

            {/* Airport Transfer Note */}
            <div className="bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 space-y-2 text-xs">
              <span className="text-gold font-bold uppercase tracking-wider block text-[10px]">
                Airport Transit Information
              </span>
              <p className="text-stone-300 leading-relaxed font-light">
                Our complimentary luxury shuttle departs from Bole International Airport Terminal 1 & 2 curbside every 30 minutes. Look for the Grand View Hotel uniform attendant at the arrival gate.
              </p>
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Send a Message to Concierge
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Fill out the inquiry form below and our guest relations manager will respond within 2 business hours.
            </p>

            {submitted ? (
              <div className="p-8 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-emerald-900 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-xl font-bold">Message Received</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{formData.name}</strong>. Your inquiry has been routed to our reservation concierge. We look forward to welcoming you to Grand View Hotel & Suites.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 inline-block text-xs font-semibold text-emerald-800 underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dawit Tadesse"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="dawit@example.com"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251 91 123 4567"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Room Reservation">Room Reservation</option>
                      <option value="Diplomatic Delegation">Diplomatic Delegation</option>
                      <option value="Dining & Banqueting">Dining & Banqueting</option>
                      <option value="Airport Shuttle Assistance">Airport Shuttle Assistance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us how we can assist you..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-stone-900 hover:bg-stone-800 text-gold-light border border-gold/40 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
                >
                  <span>Transmit Inquiry</span>
                  <Send className="w-3.5 h-3.5 text-gold" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
