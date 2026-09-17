import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'room' | 'reservation' | 'payment' | 'source' | 'housekeeping' | 'maintenance' | 'order';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'room', className = '' }) => {
  const getBadgeStyle = () => {
    const s = (status || '').toUpperCase();

    // Room & Operational Statuses
    if (s === 'AVAILABLE' || s === 'READY' || s === 'CLEAN' || s === 'RESOLVED' || s === 'CLOSED' || s === 'SETTLED' || s === 'PAID') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'OCCUPIED' || s === 'CHECKED_IN' || s === 'SERVED') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s === 'RESERVED' || s === 'CONFIRMED' || s === 'INSPECTED' || s === 'PARTIAL' || s === 'PREPARING') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s === 'CLEANING' || s === 'IN_PROGRESS') {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
    if (s === 'DIRTY' || s === 'PENDING' || s === 'NEW') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (s === 'MAINTENANCE' || s === 'ASSIGNED') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s === 'OUT_OF_SERVICE' || s === 'CANCELLED' || s === 'FAILED' || s === 'CRITICAL' || s === 'HIGH') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    // Booking Sources
    if (s === 'WEBSITE') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s === 'WALK_IN') {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    if (s === 'CORPORATE') {
      return 'bg-slate-100 text-slate-800 border-slate-300';
    }

    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide border uppercase ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {formatText(status)}
    </span>
  );
};
