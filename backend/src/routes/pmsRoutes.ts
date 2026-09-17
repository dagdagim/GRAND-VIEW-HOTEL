import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

// Controllers
import * as ReservationCtrl from '../controllers/pmsReservationController.js';
import * as FrontDeskCtrl from '../controllers/pmsFrontDeskController.js';
import * as RoomCtrl from '../controllers/pmsRoomController.js';
import * as TapeChartCtrl from '../controllers/pmsTapeChartController.js';
import * as GuestCtrl from '../controllers/pmsGuestController.js';
import * as FolioCtrl from '../controllers/pmsFolioController.js';
import * as HousekeepingCtrl from '../controllers/pmsHousekeepingController.js';
import * as MaintenanceCtrl from '../controllers/pmsMaintenanceController.js';
import * as RestaurantCtrl from '../controllers/pmsRestaurantController.js';
import * as ReportsCtrl from '../controllers/pmsReportsController.js';
import * as SettingsCtrl from '../controllers/pmsSettingsController.js';

const router = Router();

// Protect all PMS routes with authentication
router.use(authenticate);

// ==================== DASHBOARD & REPORTS ====================
router.get('/dashboard', ReportsCtrl.getDashboardSummary);
router.get('/reports', ReportsCtrl.getReports);

// ==================== FRONT DESK ====================
router.get('/frontdesk/board', FrontDeskCtrl.getFrontDeskBoard);
router.post('/frontdesk/check-in', FrontDeskCtrl.checkInGuest);
router.post('/frontdesk/check-out', FrontDeskCtrl.checkOutGuest);
router.post('/frontdesk/transfer-room', FrontDeskCtrl.transferRoom);
router.get('/frontdesk/room/:roomNumber/portal-access', FrontDeskCtrl.getRoomPortalDetails);
router.post('/frontdesk/room/:roomNumber/regenerate-passcode', FrontDeskCtrl.regenerateRoomPasscode);
router.post('/frontdesk/room/:roomNumber/send-passcode-email', FrontDeskCtrl.sendRoomPasscodeEmail);
router.get('/frontdesk/stay/:stayId/checkout-summary', FrontDeskCtrl.getCheckOutSummary);
router.get('/frontdesk/service-requests', FrontDeskCtrl.listGuestRequests);
router.post('/frontdesk/service-requests/:id/dispatch-housekeeping', FrontDeskCtrl.dispatchGuestRequestToHousekeeping);
router.patch('/frontdesk/service-requests/:id/status', FrontDeskCtrl.updateGuestRequestStatus);

// ==================== RESERVATIONS & TAPE CHART ====================
router.get('/reservations', ReservationCtrl.listReservations);
router.get('/reservations/:id', ReservationCtrl.getReservationDetails);
router.post('/reservations/walk-in', ReservationCtrl.createWalkInReservation);
router.post('/reservations/:id/cancel', ReservationCtrl.cancelReservation);
router.post('/reservations/:id/assign-room', ReservationCtrl.assignRoom);
router.get('/calendar/tape-chart', TapeChartCtrl.getTapeChartData);

// ==================== ROOMS & ROOM TYPES ====================
router.get('/rooms', RoomCtrl.listRooms);
router.post('/rooms', authorize('SUPER_ADMIN', 'HOTEL_MANAGER'), RoomCtrl.createRoom);
router.patch('/rooms/:id/status', RoomCtrl.updateRoomStatus);
router.get('/room-types', RoomCtrl.listRoomTypes);
router.patch('/room-types/:id', authorize('SUPER_ADMIN', 'HOTEL_MANAGER'), RoomCtrl.updateRoomType);

// ==================== GUESTS ====================
router.get('/guests', GuestCtrl.listGuests);
router.get('/guests/:id', GuestCtrl.getGuestProfile);
router.post('/guests', GuestCtrl.createGuest);
router.patch('/guests/:id', GuestCtrl.updateGuest);

// ==================== FOLIO, BILLING & INVOICES ====================
router.get('/folios/:id', FolioCtrl.getFolioDetails);
router.post('/folios/:id/charges', FolioCtrl.addFolioCharge);
router.post('/folios/:id/payments', FolioCtrl.processPayment);
router.post('/folios/:id/discount', authorize('SUPER_ADMIN', 'HOTEL_MANAGER', 'ACCOUNTANT'), FolioCtrl.applyDiscount);
router.get('/folios/:id/invoice', FolioCtrl.getInvoice);

// ==================== HOUSEKEEPING ====================
router.get('/housekeeping/tasks', HousekeepingCtrl.listHousekeepingTasks);
router.post('/housekeeping/tasks', HousekeepingCtrl.createHousekeepingTask);
router.patch('/housekeeping/tasks/:id/stage', HousekeepingCtrl.updateTaskStage);

// ==================== MAINTENANCE ====================
router.get('/maintenance/tickets', MaintenanceCtrl.listMaintenanceTickets);
router.post('/maintenance/tickets', MaintenanceCtrl.createMaintenanceTicket);
router.patch('/maintenance/tickets/:id', MaintenanceCtrl.updateMaintenanceTicket);
router.post('/maintenance/service-requests/:id/dispatch', MaintenanceCtrl.dispatchGuestRequestToMaintenance);
router.patch('/maintenance/service-requests/:id/resolve', MaintenanceCtrl.resolveGuestMaintenanceRequest);

// ==================== RESTAURANT POS ====================
router.get('/restaurant/catalog', RestaurantCtrl.getMenuCatalog);
router.get('/restaurant/orders', RestaurantCtrl.listOrders);
router.post('/restaurant/orders', RestaurantCtrl.createOrder);
router.patch('/restaurant/orders/:id/status', RestaurantCtrl.updateOrderStatus);
router.patch('/restaurant/orders/:id/timer', RestaurantCtrl.setOrderTimer);
router.patch('/restaurant/rooms/:roomNumber/orders', RestaurantCtrl.batchUpdateRoomOrders);
router.post('/restaurant/orders/:id/charge-room', RestaurantCtrl.chargeOrderToRoom);

// ==================== SETTINGS, AUDIT & NOTIFICATIONS ====================
router.get('/settings', SettingsCtrl.getHotelSettings);
router.patch('/settings', authorize('SUPER_ADMIN', 'HOTEL_MANAGER'), SettingsCtrl.updateHotelSettings);
router.get('/audit-logs', authorize('SUPER_ADMIN', 'HOTEL_MANAGER'), SettingsCtrl.listAuditLogs);
router.get('/notifications', SettingsCtrl.listNotifications);
router.patch('/notifications/:id/read', SettingsCtrl.markNotificationAsRead);

export default router;
