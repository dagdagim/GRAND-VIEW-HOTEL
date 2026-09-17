import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  FileText, 
  Shield, 
  Search, 
  RefreshCw, 
  Calendar, 
  User, 
  Activity,
  Code2
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface AuditLog {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export const PmsAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pms/audit-logs');
      if (res.data.status === 'success') {
        setLogs(res.data.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const query = search.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(query);
    const entityMatch = log.entity.toLowerCase().includes(query);
    const userMatch = log.userId?.name.toLowerCase().includes(query) || log.userId?.email.toLowerCase().includes(query);
    return actionMatch || entityMatch || userMatch;
  });

  const getActionColor = (action: string) => {
    if (action.includes('CHECK_IN') || action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('CHECK_OUT') || action.includes('TRANSFER')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('PAYMENT') || action.includes('CHARGE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('CANCEL') || action.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Security & Operational Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable system event log recording check-ins, check-outs, folio changes, and staff operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start md:self-auto"
          title="Refresh Audit Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by action, entity, staff name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono hidden md:block">
          Showing {filteredLogs.length} events
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Retrieving operational logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No audit events match your filter</h3>
            <p className="text-xs text-slate-400 mt-1">Actions performed across the PMS will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Staff Operator</th>
                  <th className="px-5 py-3">Event Action</th>
                  <th className="px-5 py-3">Target Entity</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLogs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5">
                      {log.userId ? (
                        <div>
                          <span className="font-bold text-slate-900 block">{log.userId.name}</span>
                          <span className="text-[10px] text-slate-400">{log.userId.role}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">SYSTEM AUTOMATION</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-800">
                      {log.entity}
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                        title="View Payload"
                      >
                        <Code2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Payload"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Event Action:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Target Entity:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedLog.entity}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Operator:</span>
                <span className="font-bold text-slate-900">{selectedLog.userId?.name || 'SYSTEM'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Timestamp:</span>
                <span className="font-bold text-slate-900 font-mono">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State / Payload Snapshot</label>
              <pre className="bg-navy-950 text-gold-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default PmsAuditLogsPage;
