import React, { useState, useEffect } from 'react';
import { Users, Search, Award, Star, Phone, Mail, History, Eye, UserCheck } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const PmsGuestsPage: React.FC = () => {
  const { formatPrice } = useCurrency();

  const [guests, setGuests] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vipFilter, setVipFilter] = useState<string>('ALL');

  // Guest Profile Modal
  const [selectedGuestProfile, setSelectedGuestProfile] = useState<any | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pms/guests', {
        params: {
          search: searchQuery,
          vipLevel: vipFilter
        }
      });
      setGuests(res.data.guests || []);
      setTotalCount(res.data.total || 0);
    } catch (e) {
      console.error('Failed to load guests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [vipFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGuests();
  };

  const handleViewProfile = async (guestId: string) => {
    setLoadingProfile(true);
    setProfileModalOpen(true);
    try {
      const res = await api.get(`/pms/guests/${guestId}`);
      setSelectedGuestProfile(res.data);
    } catch (e) {
      console.error('Failed to fetch guest profile', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getVipBadge = (level: string) => {
    switch (level) {
      case 'PLATINUM':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      case 'GOLD':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'SILVER':
        return 'bg-slate-200 text-slate-800 border-slate-300 font-medium';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gold-dark" />
            <h1 className="font-serif text-2xl font-bold text-slate-900">Guest Profiles & CRM</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lifetime guest records, VIP tier classifications, total stays, and historical folios.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          Registered Profiles: <span className="text-slate-900 font-bold">{totalCount}</span>
        </div>
      </div>

      {/* Search & VIP Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Guest Name, Phone (+251...), Email, Passport / ID..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-xs"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider"
          >
            Search
          </button>
        </form>

        <select
          value={vipFilter}
          onChange={(e) => setVipFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs"
        >
          <option value="ALL">All VIP Tiers</option>
          <option value="PLATINUM">PLATINUM Members</option>
          <option value="GOLD">GOLD Members</option>
          <option value="SILVER">SILVER Members</option>
          <option value="STANDARD">STANDARD</option>
        </select>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">Loading guest directory...</div>
        ) : guests.length === 0 ? (
          <div className="p-16 text-center text-slate-400">No guests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">VIP Status</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Nationality</th>
                  <th className="py-3 px-4">Total Stays</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.map((g) => (
                  <tr key={g._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-serif font-bold text-slate-900 text-sm block">
                        {g.fullName || `${g.firstName} ${g.lastName}`}
                      </span>
                      <span className="text-[10px] text-slate-400">ID: {g.idNumber || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getVipBadge(g.vipLevel)}`}>
                        <Award className="w-3 h-3" />
                        <span>{g.vipLevel}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{g.phone}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">{g.email}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{g.nationality || 'Ethiopian'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{g.totalStays || 0} stays</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatPrice(g.totalSpend || 0)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewProfile(g._id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile & Stays</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GUEST PROFILE & LIFETIME STAY HISTORY MODAL */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Guest Lifetime Profile & Stay History"
        maxWidth="2xl"
      >
        {loadingProfile ? (
          <div className="p-10 text-center text-slate-400 text-xs">Loading profile history...</div>
        ) : selectedGuestProfile ? (
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  {selectedGuestProfile.guest?.fullName}
                </h3>
                <span className="text-slate-500 text-xs">
                  {selectedGuestProfile.guest?.nationality} • {selectedGuestProfile.guest?.email} • {selectedGuestProfile.guest?.phone}
                </span>
              </div>
              <span className={`self-start sm:self-auto px-3 py-1 rounded text-xs font-bold uppercase border ${getVipBadge(selectedGuestProfile.guest?.vipLevel)}`}>
                VIP: {selectedGuestProfile.guest?.vipLevel}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Stays</span>
                <span className="text-lg font-bold text-slate-900">{selectedGuestProfile.guest?.totalStays || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Lifetime Revenue</span>
                <span className="text-lg font-bold text-slate-900">{formatPrice(selectedGuestProfile.guest?.totalSpend || 0)}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">ID / Passport</span>
                <span className="text-sm font-semibold text-slate-800">{selectedGuestProfile.guest?.idNumber || 'On file'}</span>
              </div>
            </div>

            {/* Stay History Table */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
                <History className="w-4 h-4 text-gold-dark" />
                <span>Historical Reservations & Stays</span>
              </h4>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px]">
                    <tr>
                      <th className="p-2.5">Booking #</th>
                      <th className="p-2.5">Room Type</th>
                      <th className="p-2.5">Check-in</th>
                      <th className="p-2.5">Check-out</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedGuestProfile.reservations?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">No recorded stays yet</td>
                      </tr>
                    ) : (
                      selectedGuestProfile.reservations?.map((r: any) => (
                        <tr key={r._id}>
                          <td className="p-2.5 font-mono font-semibold">#{r.bookingNumber}</td>
                          <td className="p-2.5">{r.roomType?.name}</td>
                          <td className="p-2.5">{new Date(r.checkInDate).toLocaleDateString()}</td>
                          <td className="p-2.5">{new Date(r.checkOutDate).toLocaleDateString()}</td>
                          <td className="p-2.5 font-bold uppercase text-[10px]">{r.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
