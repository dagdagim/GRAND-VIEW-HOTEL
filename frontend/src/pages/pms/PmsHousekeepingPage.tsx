import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, CheckCircle2, User, Clock, ArrowRight, ShieldCheck, Bell, Send, Check } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import api from '../../api/client';

export const PmsHousekeepingPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  // New task modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newRoomId, setNewRoomId] = useState<string>('');
  const [newTaskType, setNewTaskType] = useState<string>('DEPARTURE_CLEAN');
  const [newPriority, setNewPriority] = useState<string>('MEDIUM');
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState<string>('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pms/housekeeping/tasks', {
        params: { stage: stageFilter }
      });
      setTasks(res.data.tasks || []);
      setCounts(res.data.counts || {});
    } catch (e) {
      console.error('Failed to load housekeeping tasks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [stageFilter]);

  const loadCreateModalData = async () => {
    try {
      const [roomsRes, staffRes] = await Promise.all([
        api.get('/pms/rooms'),
        api.get('/auth/staff')
      ]);
      setAvailableRooms(roomsRes.data.rooms || []);
      setStaffList(staffRes.data.staff || []);
      if (roomsRes.data.rooms?.length > 0) setNewRoomId(roomsRes.data.rooms[0]._id);
      setCreateModalOpen(true);
    } catch (e) {
      alert('Could not load rooms or staff');
    }
  };

  const handleAdvanceStage = async (taskId: string, currentStage: string) => {
    const nextStages: Record<string, string> = {
      DIRTY: 'ASSIGNED',
      ASSIGNED: 'CLEANING',
      CLEANING: 'INSPECTED',
      INSPECTED: 'READY'
    };

    const nextStage = nextStages[currentStage];
    if (!nextStage) return;

    try {
      await api.patch(`/pms/housekeeping/tasks/${taskId}/stage`, {
        stage: nextStage
      });
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to advance stage');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/pms/housekeeping/tasks', {
        roomId: newRoomId,
        taskType: newTaskType,
        priority: newPriority,
        assignedStaffId: assignedStaffId || undefined,
        notes: taskNotes
      });
      setCreateModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-gold-dark" />
            <h1 className="font-serif text-2xl font-bold text-slate-900">Housekeeping Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time room cleanliness lifecycle: Dirty → Cleaning → Inspected → Ready (Available for Check-in).
          </p>
        </div>

        <button
          onClick={loadCreateModalData}
          className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Dispatch Cleaning Task</span>
        </button>
      </div>

      {/* Kanban / Stage Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'All Tasks', value: 'ALL', count: tasks.length },
          { label: 'Dirty Queue', value: 'DIRTY', count: counts.DIRTY },
          { label: 'Assigned', value: 'ASSIGNED', count: counts.ASSIGNED },
          { label: 'In Cleaning', value: 'CLEANING', count: counts.CLEANING },
          { label: 'Inspected', value: 'INSPECTED', count: counts.INSPECTED },
          { label: 'Ready & Available', value: 'READY', count: counts.READY }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStageFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all border ${
              stageFilter === tab.value
                ? 'bg-slate-900 text-gold-light border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {tab.label} {tab.count !== undefined && <span className="opacity-70">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading housekeeping queue...</div>
      ) : tasks.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No tasks found in this stage.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const isReady = task.stage === 'READY';
            const isDirty = task.stage === 'DIRTY';
            const isCleaning = task.stage === 'CLEANING';
            const isInspected = task.stage === 'INSPECTED';

            return (
              <div
                key={task._id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isReady ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-serif text-2xl font-bold text-slate-900">
                        Room {task.room?.roomNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Floor {task.room?.floor} • #{task.taskNumber}
                      </span>
                    </div>
                    <StatusBadge status={task.stage} />
                  </div>

                  <div className="flex items-center space-x-2 my-2 text-xs">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {task.taskType.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      task.priority === 'HIGH' || task.priority === 'URGENT'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  {task.assignedStaff && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 my-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Staff: <strong>{task.assignedStaff.name}</strong></span>
                    </div>
                  )}

                  {task.notes && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                      {task.notes}
                    </p>
                  )}
                </div>

                {/* Next Stage Button */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5">
                  {!isReady ? (
                    <>
                      {(task.stage === 'DIRTY' || task.stage === 'ASSIGNED') && (
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/pms/housekeeping/tasks/${task._id}/stage`, { stage: 'CLEANING' });
                              fetchTasks();
                            } catch (err: any) {
                              alert(err.response?.data?.error || 'Failed to start cleaning');
                            }
                          }}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Start Cleaning</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleAdvanceStage(task._id, task.stage)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                      >
                        <span>
                          Advance to{' '}
                          {task.stage === 'DIRTY'
                            ? 'Assigned'
                            : task.stage === 'ASSIGNED'
                            ? 'Cleaning'
                            : task.stage === 'CLEANING'
                            ? 'Inspected'
                            : 'Ready'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gold" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Room Ready & Available</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE HOUSEKEEPING TASK MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Dispatch Housekeeping Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Room *
            </label>
            <select
              required
              value={newRoomId}
              onChange={(e) => setNewRoomId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {availableRooms.map((r) => (
                <option key={r._id} value={r._id}>
                  Room {r.roomNumber} (Floor {r.floor} • Current: {r.status} - {r.cleanStatus})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Task Type
              </label>
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="DEPARTURE_CLEAN">Departure Clean</option>
                <option value="STAYOVER_CLEAN">Stayover Clean</option>
                <option value="TOUCH_UP">Touch Up</option>
                <option value="DEEP_CLEAN">Deep Clean</option>
                <option value="TURNDOWN">Turndown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Next Arrival)</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assign Housekeeper
            </label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Unassigned Queue --</option>
              {staffList
                .filter((s) => s.role === 'HOUSEKEEPER' || s.role === 'SUPER_ADMIN')
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Special Instructions
            </label>
            <textarea
              rows={3}
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              placeholder="e.g. Feather pillow replacement requested, extra bath towels"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

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
              Dispatch Task
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
