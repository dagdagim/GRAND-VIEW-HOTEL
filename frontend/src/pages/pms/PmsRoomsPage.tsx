import React, { useState, useEffect } from 'react';
import { BedDouble, Plus, Edit2, ShieldAlert, Sparkles, Filter, Check } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const PmsRoomsPage: React.FC = () => {
  const { formatPrice } = useCurrency();

  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Status Edit Modal
  const [editRoom, setEditRoom] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('AVAILABLE');
  const [newCleanStatus, setNewCleanStatus] = useState<string>('CLEAN');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  // Add Room Modal
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [newRoomNumber, setNewRoomNumber] = useState<string>('');
  const [newRoomFloor, setNewRoomFloor] = useState<number>(1);
  const [newRoomType, setNewRoomType] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        api.get('/pms/rooms', {
          params: {
            floor: floorFilter === 'ALL' ? undefined : floorFilter,
            status: statusFilter === 'ALL' ? undefined : statusFilter
          }
        }),
        api.get('/pms/room-types')
      ]);
      setRooms(roomsRes.data.rooms || []);
      setRoomTypes(typesRes.data.roomTypes || []);
      if (typesRes.data.roomTypes?.length > 0 && !newRoomType) {
        setNewRoomType(typesRes.data.roomTypes[0]._id);
      }
    } catch (e) {
      console.error('Failed to load rooms', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [floorFilter, statusFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoom) return;

    try {
      await api.patch(`/pms/rooms/${editRoom._id}/status`, {
        status: newStatus,
        cleanStatus: newCleanStatus,
        notes: statusNotes
      });
      setEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/pms/rooms', {
        roomNumber: newRoomNumber.trim(),
        floor: Number(newRoomFloor),
        roomType: newRoomType
      });
      setAddModalOpen(false);
      setNewRoomNumber('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create room');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BedDouble className="w-5 h-5 text-gold-dark" />
            <h1 className="font-serif text-2xl font-bold text-slate-900">Room Inventory Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hotel physical inventory, manage room maintenance blocks, and audit room statuses.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs"
        >
          <option value="ALL">All Floors (1 - 4)</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
          <option value="4">Floor 4</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs"
        >
          <option value="ALL">All Operational Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="OCCUPIED">OCCUPIED</option>
          <option value="RESERVED">RESERVED</option>
          <option value="CLEANING">CLEANING</option>
          <option value="DIRTY">DIRTY</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">Loading room inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Room #</th>
                  <th className="py-3 px-4">Floor</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-4">Nightly Rate</th>
                  <th className="py-3 px-4">Operational Status</th>
                  <th className="py-3 px-4">Cleanliness</th>
                  <th className="py-3 px-4">Current Stay</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-serif font-bold text-slate-900 text-base">
                      {room.roomNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      Floor {room.floor}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{room.roomType?.name}</span>
                      <span className="text-[10px] text-slate-400">{room.roomType?.bedType}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatPrice(room.roomType?.basePrice || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={room.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          room.cleanStatus === 'CLEAN'
                            ? 'bg-emerald-50 text-emerald-700'
                            : room.cleanStatus === 'INSPECTED'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {room.cleanStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {room.currentStay?.guest?.fullName ? (
                        <span className="font-semibold text-blue-700">
                          {room.currentStay.guest.fullName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditRoom(room);
                          setNewStatus(room.status);
                          setNewCleanStatus(room.cleanStatus);
                          setStatusNotes(room.notes || '');
                          setEditModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Status</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT STATUS MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Update Status: Room ${editRoom?.roomNumber}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Operational Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="AVAILABLE">AVAILABLE (Vacant & Ready)</option>
              <option value="OCCUPIED">OCCUPIED</option>
              <option value="RESERVED">RESERVED</option>
              <option value="CLEANING">CLEANING</option>
              <option value="DIRTY">DIRTY</option>
              <option value="MAINTENANCE">MAINTENANCE (Block Room)</option>
              <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cleanliness Status
            </label>
            <select
              value={newCleanStatus}
              onChange={(e) => setNewCleanStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="CLEAN">CLEAN</option>
              <option value="DIRTY">DIRTY</option>
              <option value="INSPECTED">INSPECTED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Operational Remarks / Notes
            </label>
            <textarea
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="e.g. Scheduled for carpet shampoo, or minor plumbing check"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD ROOM MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Room to Hotel Inventory"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 501"
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Floor Number *
            </label>
            <input
              type="number"
              min={1}
              max={10}
              required
              value={newRoomFloor}
              onChange={(e) => setNewRoomFloor(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Type *
            </label>
            <select
              required
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {roomTypes.map((rt) => (
                <option key={rt._id} value={rt._id}>
                  {rt.name} ({rt.code}) - ETB {rt.basePrice}/night
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Create Room
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
