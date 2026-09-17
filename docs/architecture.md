# System Architecture Documentation
## Grand View Hotel & Suites — Enterprise PMS & Online Booking Engine

### 1. Architectural Overview

Grand View Hotel & Suites is architected as a commercial-grade, decoupled web application consisting of:
1. **Public Guest Experience & Direct Booking Engine**: High-converting, brand-aligned responsive client.
2. **Back-Office Property Management System (PMS)**: High-density, keyboard-friendly desktop operational suite for 24/7 front desk, housekeeping, restaurant POS, and finance teams.
3. **Unified RESTful API Backend**: Node.js & TypeScript service handling business rules, concurrency management, folio ledger accounting, and audit logging.
4. **Single Source of Truth Database**: MongoDB cluster maintaining real-time room availability, reservations, and financial folios.

```
                         ┌────────────────────────────────────────────────────────┐
                         │                     INTERNET / CLIENTS                 │
                         └───────────────────────────┬────────────────────────────┘
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             │                                               │
                             ▼                                               ▼
             ┌───────────────────────────────┐               ┌───────────────────────────────┐
             │    PUBLIC ONLINE PORTAL       │               │       HOTEL PMS DESK          │
             │   - Luxury Brand Showcase     │               │   - Front Desk Floor Grid     │
             │   - Live Availability Search  │               │   - Multi-Room Tape Chart     │
             │   - 3-Step Instant Booking    │               │   - Folio Ledger & Invoicing  │
             │   - Booking Voucher Retrieval │               │   - Restaurant POS / Room Chg │
             │   - Telebirr/Chapa/Hotel Pay  │               │   - Housekeeping Workflow     │
             └───────────────┬───────────────┘               └───────────────┬───────────────┘
                             │                                               │
                             │ (HTTPS / JSON API)                            │ (JWT Bearer Auth)
                             │                                               │
                             ▼                                               ▼
             ┌───────────────────────────────────────────────────────────────────────────────┐
             │                          EXPRESS.JS REST API GATEWAY                          │
             │   - Global CORS, Rate Limiting, Helmet Security, Morgan Logging               │
             │   - Role-Based Access Control (RBAC) Guard Middleware                         │
             │   - Server-side Tax (15% VAT) & Service Charge (10%) Calculator               │
             └───────────────────────────────────────┬───────────────────────────────────────┘
                                                     │
                                                     ▼
             ┌───────────────────────────────────────────────────────────────────────────────┐
             │                             BUSINESS DOMAIN SERVICES                          │
             ├───────────────────────┬───────────────────────┬───────────────────────────────┤
             │  AvailabilityService  │     FolioService      │        PaymentService         │
             │  - Date-overlap math  │  - Running balance    │  - Gateway verification       │
             │  - Out-of-order blocks│  - Room charge router │  - Refund state machine       │
             │  - Zero double-booking│  - Split invoicing    │  - Cash / card receipts       │
             └───────────────────────┴───────────────────────┴───────────────────────────────┘
                                                     │
                                                     ▼
             ┌───────────────────────────────────────────────────────────────────────────────┐
             │                             DATA PERSISTENCE LAYER                            │
             │                        MongoDB Database (`hotel_pms`)                         │
             │  - 32 Physical Rooms across 4 Floors (101-408)                                │
             │  - 6 Master Room Categories (STD-K, DLX-K, DLX-T, JUNIOR, EXEC, PRES)         │
             │  - ACID Multi-Document Transactions for Reservation Locking                   │
             └───────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Core Design Principles

1. **Single Source of Truth Inventory**:
   - Both the public booking engine and the front desk interact with the exact same `Room` and `Reservation` collections.
   - An online guest booking a Junior Suite instantly flags the inventory unavailable on the Front Desk Tape Chart in real time.
2. **Server-Authoritative Pricing & Taxes**:
   - The frontend never dictates prices, taxes, or discounts. The backend computes:
     $$\text{VAT} = 15\% \times \text{Base Amount}$$
     $$\text{Service Charge} = 10\% \times \text{Base Amount}$$
     $$\text{Total Folio Balance} = \text{Base} + \text{VAT} + \text{Service Charge} - \text{Payments}$$
3. **Double-Booking Prevention Algorithm**:
   - Two stays overlap if and only if:
     $$\max(\text{checkIn}_A, \text{checkIn}_B) < \min(\text{checkOut}_A, \text{checkOut}_B)$$
   - Active reservations with statuses `CONFIRMED`, `CHECKED_IN`, or `GUARANTEED` lock room allocation.
   - Rooms undergoing `MAINTENANCE` or `OUT_OF_SERVICE` are excluded from the available inventory pipeline.
4. **Direct Charge to Room Folio (Cross-Department Ledger)**:
   - When a guest dines at the restaurant, the POS queries in-house guests by room number.
   - The system verifies the room is `OCCUPIED` and attaches the itemized order to the guest's active `Folio`, updating the balance instantly.

---

### 3. Repository Structure

```
Hotel/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection with resilient failover
│   │   ├── controllers/     # Public, PMS, Auth, and POS controllers
│   │   ├── middleware/      # JWT verification, RBAC guard, error handling
│   │   ├── models/          # Mongoose schemas (Room, Reservation, Folio, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Availability, Folio, Payment, Email services
│   │   ├── seed.ts          # Realistic seed generator (32 rooms, 25 guests, stays)
│   │   ├── test-availability.ts # Automated test suite
│   │   └── server.ts        # App entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with JWT auto-injection
│   │   ├── components/      # Common UI (Modal, StatusBadge, StatCard, Navbar, Footer)
│   │   ├── context/         # AuthContext, CurrencyContext (ETB/USD)
│   │   ├── pages/
│   │   │   ├── public/      # Home, Rooms, Booking, Voucher, Amenities, Offers, Contact
│   │   │   └── pms/         # Dashboard, Front Desk, Tape Chart, Rooms, Guests, Housekeeping, POS, Billing, Reports, Staff, Settings, Audit
│   │   ├── App.tsx          # Master routing switch
│   │   └── main.tsx         # React root
│   ├── index.html
│   ├── tailwind.config.js   # Tailored luxury hospitality design tokens
│   ├── vite.config.ts       # Vite configuration with proxy to port 5000
│   └── package.json
└── docs/                    # Complete architectural & operational guides
```
