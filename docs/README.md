# Grand View Hotel & Suites — Complete Web Application & PMS Overview

## 1. Live Services Summary

- **Public Website & Booking Engine**: [http://localhost:5173/](http://localhost:5173/)
- **Hotel PMS Staff Application**: [http://localhost:5173/pms/login](http://localhost:5173/pms/login)
- **Backend API Gateway**: [http://localhost:5000/api](http://localhost:5000/api)
- **Database**: Local Docker MongoDB on port 27017 (`hotel_pms`)

---

## 2. Quick Demo Logins

Visit [http://localhost:5173/pms/login](http://localhost:5173/pms/login) and use the 1-click role buttons:

| Staff Role | Email | Password |
| :--- | :--- | :--- |
| **Front Desk Receptionist** | `receptionist@grandviewhotel.com` | `ReceptionPass123!` |
| **Hotel Duty Manager** | `manager@grandviewhotel.com` | `ManagerPass123!` |
| **Super Administrator** | `admin@grandviewhotel.com` | `AdminPass123!` |
| **Restaurant POS & Dining** | `restaurant@grandviewhotel.com` | `RestaurantPass123!` |
| **Housekeeping Supervisor** | `housekeeping@grandviewhotel.com` | `HousekeepingPass123!` |

---

## 3. Key Architecture & Features

1. **Single Shared Database**: Real-time room inventory is shared across the public booking engine and the front desk. Online bookings flag the source as `ONLINE` and lock inventory from the Tape Chart immediately.
2. **Server-Side Fiscal Calculations**: 15% VAT and 10% Service Charge are computed on the server on all stays and restaurant bills.
3. **Cross-Department Folio Posting**: Waiters can charge restaurant meals directly to any in-house guest room folio.
4. **Housekeeping State Machine**: Checking out marks room `DIRTY` and queues a cleaning task. Marking `READY` automatically sets room back to `AVAILABLE`.
5. **Full Documentation Suite**: Available in `/docs`.
