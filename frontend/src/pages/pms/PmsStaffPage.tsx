import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Search,
  Key
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HOTEL_MANAGER' | 'RECEPTIONIST' | 'HOUSEKEEPING' | 'RESTAURANT_STAFF' | 'MAINTENANCE' | 'ACCOUNTANT';
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const ROLE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', bg: 'bg-purple-100', text: 'text-purple-800' },
  HOTEL_MANAGER: { label: 'Hotel Manager', bg: 'bg-navy-100', text: 'text-navy-900' },
  RECEPTIONIST: { label: 'Front Desk', bg: 'bg-blue-100', text: 'text-blue-800' },
  HOUSEKEEPING: { label: 'Housekeeping', bg: 'bg-teal-100', text: 'text-teal-800' },
  RESTAURANT_STAFF: { label: 'F&B Service', bg: 'bg-amber-100', text: 'text-amber-800' },
  MAINTENANCE: { label: 'Engineering', bg: 'bg-orange-100', text: 'text-orange-800' },
  ACCOUNTANT: { label: 'Finance', bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

export const PmsStaffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New staff form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST' as StaffUser['role'],
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/staff');
      const list = res.data?.data?.staff || res.data?.staff || [];
      setStaffList(list);
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (staff: StaffUser) => {
    if (staff._id === currentUser?.id) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    try {
      const newStatus = !staff.isActive;
      await api.patch(`/auth/staff/${staff._id}/status`, { isActive: newStatus });
      setStaffList(prev => prev.map(s => s._id === staff._id ? { ...s, isActive: newStatus } : s));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update staff status');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/staff', formData);
      if (res.data.status === 'success') {
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'RECEPTIONIST',
          phone: '',
        });
        fetchStaff();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Staff & Role Access Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage operational personnel, access privileges, and departmental assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStaff}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh Staff"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'HOTEL_MANAGER', 'RECEPTIONIST', 'RESTAURANT_STAFF', 'HOUSEKEEPING', 'MAINTENANCE'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                roleFilter === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : ROLE_BADGES[r]?.label || r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading staff records...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No staff members found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Role & Department</th>
                  <th className="px-5 py-3">Contact Details</th>
                  <th className="px-5 py-3">Account Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStaff.map(staff => {
                  const badge = ROLE_BADGES[staff.role] || { label: staff.role, bg: 'bg-slate-100', text: 'text-slate-800' };
                  return (
                    <tr key={staff._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-navy-900 text-gold-400 font-serif font-bold text-xs flex items-center justify-center border border-gold-600/30">
                            {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{staff.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {staff.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{staff.phone || '+251 91 123 4567'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {staff.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            <XCircle className="w-3 h-3" /> Suspended
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          disabled={staff._id === currentUser?.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            staff._id === currentUser?.id
                              ? 'text-slate-300 cursor-not-allowed'
                              : staff.isActive
                              ? 'text-red-700 hover:bg-red-50 border border-red-200'
                              : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {staff.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Staff Member"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Almaz Haile"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Email *</label>
            <input
              type="email"
              required
              placeholder="e.g., almaz@grandviewhotel.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role / Department *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
              >
                <option value="RECEPTIONIST">Front Desk Receptionist</option>
                <option value="HOTEL_MANAGER">Hotel Duty Manager</option>
                <option value="RESTAURANT_STAFF">Restaurant / Room Service</option>
                <option value="HOUSEKEEPING">Housekeeping Staff</option>
                <option value="MAINTENANCE">Maintenance Engineer</option>
                <option value="ACCOUNTANT">Financial Accountant</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Direct Phone</label>
              <input
                type="text"
                placeholder="+251 91 123 4567"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gold-600 hover:bg-gold-700 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default PmsStaffPage;
