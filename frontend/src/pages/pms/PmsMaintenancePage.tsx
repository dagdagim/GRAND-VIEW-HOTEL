import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle2, AlertTriangle, ShieldAlert, User, Check, Bell, Send } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import api from '../../api/client';

export const PmsMaintenancePage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create ticket modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [facilityArea, setFacilityArea] = useState<string>('');
  const [issueTitle, setIssueTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('PLUMBING');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [blockRoom, setBlockRoom] = useState<boolean>(false);
  const [assignedTo, setAssignedTo] = useState<string>('');

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/auth/staff');
      const list = res.data?.staff || res.data?.data?.staff || [];
      setStaff(Array.isArray(list) ? list : []);
    } catch (_) {}
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pms/maintenance/tickets', {
        params: { status: statusFilter }
      });
      setTickets(res.data.tickets || []);
      setCounts(res.data.counts || {});
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStaffList();
  }, [statusFilter]);

  const loadCreateData = async () => {
    try {
      const [roomsRes, staffRes] = await Promise.all([
        api.get('/pms/rooms'),
        api.get('/auth/staff')
      ]);
      setRooms(roomsRes.data.rooms || []);
      setStaff(staffRes.data.staff || []);
      if (roomsRes.data.rooms?.length > 0) setSelectedRoomId(roomsRes.data.rooms[0]._id);
      setCreateModalOpen(true);
    } catch (e) {
      alert('Failed to load rooms or staff');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await api.patch(`/pms/maintenance/tickets/${ticketId}`, {
        status: 'RESOLVED',
        resolutionNotes: 'Repaired by engineering staff'
      });
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to resolve ticket');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/pms/maintenance/tickets', {
        roomId: selectedRoomId || undefined,
        facilityArea: facilityArea || undefined,
        issueTitle,
        description,
        category,
        priority,
        blockRoomFromBooking: blockRoom,
        assignedTo: assignedTo || undefined
      });
      setCreateModalOpen(false);
      setIssueTitle('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create ticket');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-gold-dark" />
            <h1 className="font-serif text-2xl font-bold text-slate-900">Engineering & Maintenance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Facility tickets, equipment repairs, and room availability protection locks.
          </p>
        </div>

        <button
          onClick={loadCreateData}
          className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>New Maintenance Ticket</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
              statusFilter === st
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Tickets' : st.replace(/_/g, ' ')}
            {st !== 'ALL' && counts[st] !== undefined && (
              <span className="ml-1.5 opacity-70">({counts[st]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center text-slate-400">No maintenance tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ticket #</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Issue Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Room Block</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{t.ticketNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {t.room ? `Room ${t.room.roomNumber}` : t.facilityArea || 'General Facility'}
                    </td>
                    <td className="py-3 px-4 max-w-[240px]">
                      <span className="font-bold text-slate-900 block truncate">{t.issueTitle}</span>
                      <span className="text-[11px] text-slate-500 truncate block">{t.description}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        t.priority === 'CRITICAL' || t.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {t.blockRoomFromBooking ? (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
                          LOCKED
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {t.assignedTo ? t.assignedTo.name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? (
                        <button
                          onClick={() => handleResolveTicket(t._id)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-2xs"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px]">✓ Repaired</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Engineering Maintenance Ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Room (Leave empty for common areas)
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- General Facility / Common Area --</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  Room {r.roomNumber} (Floor {r.floor})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Facility Area (If not a specific room)
            </label>
            <input
              type="text"
              placeholder="e.g. 3rd Floor Elevator, Lobby Fountain, Pool Pump"
              value={facilityArea}
              onChange={(e) => setFacilityArea(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shower mixer valve leak"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="HVAC">HVAC / Air Conditioning</option>
                <option value="FURNITURE">Furniture & Carpentry</option>
                <option value="KEY_LOCK">Electronic Key Lock</option>
                <option value="ELECTRONICS">Electronics & TV</option>
                <option value="STRUCTURAL">Structural & Glass</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical (Emergency)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assign Engineering Staff
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Unassigned Queue --</option>
              {staff
                .filter((s) => s.role === 'MAINTENANCE' || s.role === 'SUPER_ADMIN')
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, parts required, symptoms..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center space-x-2 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={blockRoom}
              onChange={(e) => setBlockRoom(e.target.checked)}
              className="text-gold focus:ring-gold rounded"
            />
            <span className="text-xs font-bold text-amber-900">
              Lock Room from Booking & Availability (Mark room MAINTENANCE)
            </span>
          </label>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Open Ticket
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
