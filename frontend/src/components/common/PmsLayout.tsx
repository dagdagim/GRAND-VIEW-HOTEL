import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ConciergeBell, 
  CalendarCheck, 
  CalendarRange, 
  BedDouble, 
  Users, 
  Sparkles, 
  Wrench, 
  UtensilsCrossed, 
  Receipt, 
  BarChart3, 
  UserCog, 
  Settings, 
  ScrollText, 
  LogOut, 
  Bell, 
  ExternalLink,
  Search,
  PlusCircle,
  Clock,
  Menu,
  X,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

interface PmsLayoutProps {
  children: React.ReactNode;
}

export const PmsLayout: React.FC<PmsLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Live time updater
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/pms/notifications');
        setUnreadCount(res.data.unreadCount || 0);
        setNotifications(res.data.notifications || []);
      } catch (e) {
        // Silently handle if unauthenticated
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markNotificationRead = async (id: string) => {
    try {
      await api.patch(`/pms/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  interface NavItem {
    name: string;
    path: string;
    icon: any;
    roles?: string[];
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Dashboard', path: '/pms/dashboard', icon: LayoutDashboard },
        { 
          name: 'Front Desk', 
          path: '/pms/front-desk', 
          icon: ConciergeBell,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST']
        },
        { 
          name: 'Reservations', 
          path: '/pms/reservations', 
          icon: CalendarCheck,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST', 'ACCOUNTANT']
        },
        { 
          name: 'Tape Chart', 
          path: '/pms/calendar', 
          icon: CalendarRange,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST']
        },
        { 
          name: 'Rooms', 
          path: '/pms/rooms', 
          icon: BedDouble,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE']
        },
        { 
          name: 'Guests', 
          path: '/pms/guests', 
          icon: Users,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST']
        }
      ]
    },
    {
      title: 'SERVICES & POS',
      items: [
        { 
          name: 'Housekeeping', 
          path: '/pms/housekeeping', 
          icon: Sparkles,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']
        },
        { 
          name: 'Maintenance', 
          path: '/pms/maintenance', 
          icon: Wrench,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'MAINTENANCE', 'HOUSEKEEPING', 'RECEPTIONIST']
        },
        { 
          name: 'Restaurant / POS', 
          path: '/pms/restaurant', 
          icon: UtensilsCrossed,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'RESTAURANT_STAFF']
        }
      ]
    },
    {
      title: 'FINANCIALS',
      items: [
        { 
          name: 'Billing & Folios', 
          path: '/pms/billing', 
          icon: Receipt,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'ACCOUNTANT', 'RECEPTIONIST']
        },
        { 
          name: 'Reports & Analytics', 
          path: '/pms/reports', 
          icon: BarChart3,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER', 'ACCOUNTANT']
        }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { 
          name: 'Staff Management', 
          path: '/pms/staff', 
          icon: UserCog,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER']
        },
        { 
          name: 'Hotel Settings', 
          path: '/pms/settings', 
          icon: Settings,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER']
        },
        { 
          name: 'Audit Logs', 
          path: '/pms/audit-logs', 
          icon: ScrollText,
          roles: ['SUPER_ADMIN', 'HOTEL_MANAGER']
        }
      ]
    }
  ];

  const filteredNavGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || (user?.role && item.roles.includes(user.role)))
    }))
    .filter(group => group.items.length > 0);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* LEFT DESKTOP SIDEBAR */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-18' : 'w-64'
        } bg-slate-900 text-slate-200 flex flex-col shrink-0 transition-all duration-200 border-r border-slate-800 z-30`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
          {!sidebarCollapsed && (
            <Link to="/pms/dashboard" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold flex items-center justify-center text-gold font-serif font-bold text-base">
                G
              </div>
              <div>
                <span className="font-serif font-bold text-white tracking-wide text-sm block leading-none">
                  GRAND VIEW
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-medium block mt-0.5">
                  Hotel PMS v2.4
                </span>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gold/20 border border-gold flex items-center justify-center text-gold font-serif font-bold text-base">
              G
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {filteredNavGroups.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? 'bg-gold/20 text-gold-light border-l-2 border-gold font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-gold' : 'text-slate-400'}`} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Public website link and User logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-gold transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            {!sidebarCollapsed && <span>View Public Website</span>}
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP OPERATIONAL APP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
          {/* Left search & clock */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-gold-dark" />
              <span>{currentTime}</span>
            </div>

            <div className="hidden md:flex items-center text-xs text-slate-400">
              <span>Bole Corridor • 32 Rooms • Addis Ababa</span>
            </div>
          </div>

          {/* Right actions: Quick Action, Notifications, User */}
          <div className="flex items-center space-x-4">
            {/* Quick Action Buttons */}
            <button
              onClick={() => navigate('/pms/front-desk?action=walkin')}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-gold/15 hover:bg-gold/25 text-gold-dark border border-gold/40 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-gold" />
              <span>New Walk-in</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Operational Alerts
                    </span>
                    <span className="text-[10px] font-semibold bg-gold/15 text-gold-dark px-1.5 py-0.5 rounded">
                      {unreadCount} new
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No recent alerts</div>
                    ) : (
                      notifications.slice(0, 8).map((n) => {
                        const isDayFinished = n.type === 'GUEST_DAY_FINISHED' || n.title?.includes('Day Finished');
                        return (
                          <div
                            key={n._id}
                            onClick={() => {
                              markNotificationRead(n._id);
                              if (isDayFinished) {
                                setShowNotifications(false);
                                navigate('/pms/front-desk');
                              }
                            }}
                            className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.isRead 
                                ? (isDayFinished ? 'bg-indigo-50/70 border-l-2 border-indigo-600' : 'bg-amber-50/50') 
                                : ''
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                              {isDayFinished && <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                              <span>{n.title}</span>
                            </div>
                            <div className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                              {n.message}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                              <span>
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isDayFinished && (
                                <span className="text-[10px] font-bold text-indigo-700 hover:underline">
                                  View on Board →
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center">
                    <Link
                      to="/pms/audit-logs"
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] font-semibold text-gold-dark hover:underline"
                    >
                      View All Operational Logs →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Current Staff User profile */}
            <div className="flex items-center space-x-2.5 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-gold font-semibold text-xs flex items-center justify-center border border-gold/40 shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || 'Staff User'}
                </span>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {user?.role?.replace(/_/g, ' ') || 'STAFF'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/80">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
