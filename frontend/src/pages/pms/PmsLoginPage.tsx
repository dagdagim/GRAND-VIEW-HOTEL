import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PmsLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('receptionist@grandviewhotel.com');
  const [password, setPassword] = useState<string>('ReceptionPass123!');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/pms/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or inactive staff account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/20 border border-gold flex items-center justify-center text-gold font-serif font-bold text-2xl shadow-lg mb-4">
          G
        </div>
        <h1 className="font-serif text-3xl font-bold text-white tracking-wide">
          GRAND VIEW
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mt-1">
          Property Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Staff Authentication</h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorized hotel personnel and operations terminal.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to PMS Terminal'}</span>
              <ArrowRight className="w-4 h-4 text-gold" />
            </button>
          </form>

          {/* Quick 1-Click Role Logins */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Quick 1-Click Role Switcher
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoAccount('receptionist@grandviewhotel.com', 'ReceptionPass123!')}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-slate-800">Receptionist</div>
                <div className="text-[10px] text-slate-400">Front Desk & Check-in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAccount('manager@grandviewhotel.com', 'ManagerPass123!')}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-slate-800">Hotel Manager</div>
                <div className="text-[10px] text-slate-400">Full Operational Control</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAccount('restaurant@grandviewhotel.com', 'RestaurantPass123!')}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-slate-800">Restaurant Staff</div>
                <div className="text-[10px] text-slate-400">POS & Room Charge</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAccount('housekeeping@grandviewhotel.com', 'HousekeepingPass123!')}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-slate-800">Housekeeper</div>
                <div className="text-[10px] text-slate-400">Cleaning & Room Ready</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center space-x-1"
            >
              <span>← Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
