import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  Building2, 
  Clock, 
  Receipt, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  SlidersHorizontal,
  CreditCard,
  Globe
} from 'lucide-react';

interface HotelSettings {
  name: string;
  tagline?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
  };
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  taxRate: number; // e.g., 0.15 for 15% VAT
  serviceChargeRate: number; // e.g., 0.10 for 10%
  cancellationPolicyHours: number;
  onlineBookingEnabled: boolean;
}

export const PmsSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [settings, setSettings] = useState<HotelSettings>({
    name: 'Grand View Hotel & Suites',
    tagline: 'Your stay, thoughtfully made.',
    email: 'reservations@grandviewhotel.com',
    phone: '+251 11 667 9090',
    address: {
      street: 'Bole Sub-City, Namibia Street, Next to Edna Mall',
      city: 'Addis Ababa',
      country: 'Ethiopia'
    },
    checkInTime: '14:00',
    checkOutTime: '11:00',
    currency: 'ETB',
    taxRate: 0.15,
    serviceChargeRate: 0.10,
    cancellationPolicyHours: 48,
    onlineBookingEnabled: true
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pms/settings');
      if (res.data.status === 'success' && res.data.data.settings) {
        setSettings(res.data.data.settings);
      }
    } catch (err) {
      console.error('Failed to load hotel settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.patch('/pms/settings', settings);
      if (res.data.status === 'success') {
        setSuccessMsg('Hotel operational policies and settings updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update hotel settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Hotel Operational Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure property details, tax regulations, check-in schedules, and online booking engine parameters.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start md:self-auto"
          title="Reload Settings"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading hotel configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Property Identity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-gold-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Property Identity & Branding</h2>
                <p className="text-xs text-slate-400">Printed on official guest vouchers, invoices, and folio folios</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Legal Name</label>
                <input
                  type="text"
                  required
                  value={settings.name}
                  onChange={e => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Reservations Email</label>
                <input
                  type="email"
                  required
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Concierge & Front Desk Phone</label>
                <input
                  type="text"
                  required
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={settings.address?.street || ''}
                  onChange={e => setSettings({
                    ...settings,
                    address: { ...settings.address, street: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Operational Timing & Turnaround */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-gold-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Check-in & Check-out Schedule</h2>
                <p className="text-xs text-slate-400">Controls automated housekeeping queues and early/late arrivals</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Standard Check-In Time</label>
                <input
                  type="time"
                  required
                  value={settings.checkInTime}
                  onChange={e => setSettings({ ...settings, checkInTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Standard Check-Out Time</label>
                <input
                  type="time"
                  required
                  value={settings.checkOutTime}
                  onChange={e => setSettings({ ...settings, checkOutTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Free Cancellation Window (Hours)</label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={settings.cancellationPolicyHours}
                  onChange={e => setSettings({ ...settings, cancellationPolicyHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Taxes & Financial Surcharges */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Receipt className="w-5 h-5 text-gold-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Taxation & Fiscal Regulations</h2>
                <p className="text-xs text-slate-400">Server-side calculation applied automatically on all stays and restaurant bills</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Billing Currency</label>
                <select
                  value={settings.currency}
                  onChange={e => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                >
                  <option value="ETB">ETB - Ethiopian Birr</option>
                  <option value="USD">USD - United States Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Value Added Tax (VAT) %</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.taxRate}
                    onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    ({(settings.taxRate * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Charge %</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.serviceChargeRate}
                    onChange={e => setSettings({ ...settings, serviceChargeRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    ({(settings.serviceChargeRate * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Public Website & Booking Engine Integration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-5 h-5 text-gold-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Online Booking Engine Controls</h2>
                <p className="text-xs text-slate-400">Enable or disable direct online bookings from the public website</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <div className="text-xs font-bold text-slate-900">Allow Direct Public Reservations</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  When enabled, website guests can book rooms in real-time, instantly deducting live inventory.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.onlineBookingEnabled}
                  onChange={e => setSettings({ ...settings, onlineBookingEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-600"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default PmsSettingsPage;
