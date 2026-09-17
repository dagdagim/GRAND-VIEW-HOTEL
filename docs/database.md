# Database Schema & Data Models Documentation
## Grand View Hotel & Suites — MongoDB Architecture

### 1. Database Specifications
- **Database Engine**: MongoDB 6+ / 7+ (WiredTiger Storage Engine)
- **Database Name**: `hotel_pms`
- **Data Integrity**: Enforced via Mongoose schemas, unique compound indexes, and ACID session transactions during room allocation and checkout.

---

### 2. Entity Relationship Diagram (Conceptual)

```
  ┌──────────────┐         1:N         ┌──────────────┐
  │   RoomType   │ ◄────────────────── │     Room     │
  └──────────────┘                     └──────┬───────┘
                                              │ 1:N
                                              ▼
┌──────────────┐         1:N           ┌──────────────┐         1:1           ┌──────────────┐
│    Guest     │ ────────────────────► │ Reservation  │ ────────────────────► │     Stay     │
└──────────────┘                       └──────┬───────┘                       └──────┬───────┘
                                              │ 1:1                                  │ 1:1
                                              ▼                                      ▼
                                       ┌──────────────┐                       ┌──────────────┐
                                       │    Folio     │ ◄─────────────────────│  Restaurant  │
                                       │  (Ledger)    │     Direct Room       │    Order     │
                                       └──────┬───────┘       Charge          └──────────────┘
                                              │ 1:N
                                              ▼
                                       ┌──────────────┐
                                       │   Payment    │
                                       └──────────────┘
```

---

### 3. Collection Specifications

#### 3.1. `users` (Staff & System Accounts)
Stores operational staff credentials with strict role-based access control.
- `_id`: `ObjectId`
- `name`: `String` (Required)
- `email`: `String` (Required, Unique, Indexed)
- `password`: `String` (Bcrypt hash with salt rounds = 10)
- `role`: `Enum` ['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'HOUSEKEEPER', 'MAINTENANCE', 'RESTAURANT_STAFF']
- `phone`: `String`
- `isActive`: `Boolean` (Default: `true`)
- `lastLogin`: `Date`
- `timestamps`: `true`

#### 3.2. `room_types` (Room Categories)
Defines catalog specifications, capacities, base pricing, and luxury amenities.
- `_id`: `ObjectId`
- `code`: `String` (Unique, e.g., 'STD-K', 'DLX-K', 'DLX-T', 'JUNIOR', 'EXEC', 'PRES')
- `name`: `String` (e.g., 'Presidential Diplomatic Suite')
- `description`: `String`
- `basePrice`: `Number` (Nightly rate in ETB)
- `maxOccupancy`: `Number`
- `bedConfiguration`: `String` (e.g., '1 King Bed')
- `sizeSqMeters`: `Number`
- `amenities`: `[String]`
- `images`: `[String]` (Curated high-resolution photography)
- `totalRooms`: `Number` (Total units of this type in physical inventory)

#### 3.3. `rooms` (Physical Inventory Keys)
Represents the 32 individual hotel rooms distributed across 4 floors.
- `_id`: `ObjectId`
- `roomNumber`: `String` (Unique, e.g., '101' - '408')
- `floor`: `Number` (1, 2, 3, or 4)
- `roomTypeId`: `ObjectId` (Ref: `RoomType`, Indexed)
- `status`: `Enum` ['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'INSPECTED', 'MAINTENANCE', 'OUT_OF_SERVICE']
- `isClean`: `Boolean`
- `activeStayId`: `ObjectId` (Ref: `Stay`, nullable)
- `notes`: `String`

#### 3.4. `guests` (Guest Master Profile & CRM)
Tracks repeat guest loyalty, identity documents, VIP tier, and billing preferences.
- `_id`: `ObjectId`
- `firstName`: `String`
- `lastName`: `String`
- `email`: `String` (Indexed)
- `phone`: `String`
- `nationality`: `String`
- `idType`: `Enum` ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE']
- `idNumber`: `String`
- `vipTier`: `Enum` ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']
- `specialRequests`: `String`
- `totalStays`: `Number` (Default: 0)
- `lifetimeSpend`: `Number` (Default: 0)

#### 3.5. `reservations` (Booking Contracts)
Core booking record connecting guests, dates, inventory allocation, and channel sources.
- `_id`: `ObjectId`
- `bookingNumber`: `String` (Unique, e.g., 'GVH-89241', Indexed)
- `guestId`: `ObjectId` (Ref: `Guest`, Indexed)
- `roomTypeId`: `ObjectId` (Ref: `RoomType`, Indexed)
- `assignedRoomId`: `ObjectId` (Ref: `Room`, Nullable until check-in or pre-assignment)
- `checkInDate`: `Date` (Indexed)
- `checkOutDate`: `Date` (Indexed)
- `adults`: `Number` (Min: 1)
- `children`: `Number` (Default: 0)
- `status`: `Enum` ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']
- `source`: `Enum` ['ONLINE', 'WALK_IN', 'PHONE', 'CORPORATE', 'TRAVEL_AGENT']
- `nightlyRate`: `Number`
- `totalBaseRate`: `Number`
- `taxAmount`: `Number` (15% VAT)
- `serviceCharge`: `Number` (10%)
- `grandTotal`: `Number`
- `folioId`: `ObjectId` (Ref: `Folio`)
- `specialRequests`: `String`

#### 3.6. `stays` (In-House Guest Residency)
Records the active physical occupancy of a room from arrival to departure.
- `_id`: `ObjectId`
- `reservationId`: `ObjectId` (Ref: `Reservation`, Unique)
- `guestId`: `ObjectId` (Ref: `Guest`)
- `roomId`: `ObjectId` (Ref: `Room`, Indexed)
- `actualCheckIn`: `Date`
- `actualCheckOut`: `Date` (Nullable)
- `keyCardsIssued`: `Number` (Default: 2)
- `status`: `Enum` ['IN_HOUSE', 'CHECKED_OUT']

#### 3.7. `folios` (Financial Ledger & Invoices)
Maintains the double-entry accounting ledger of all room nights, minibar, dining, and spa charges.
- `_id`: `ObjectId`
- `folioNumber`: `String` (Unique, e.g., 'FOL-2026-0042')
- `reservationId`: `ObjectId` (Ref: `Reservation`)
- `guestId`: `ObjectId` (Ref: `Guest`)
- `roomId`: `ObjectId` (Ref: `Room`)
- `charges`: `Array` of subdocuments:
  - `date`: `Date`
  - `department`: `Enum` ['ROOM', 'RESTAURANT', 'SPA', 'MINIBAR', 'LAUNDRY', 'TRANSPORT', 'MISC']
  - `description`: `String`
  - `baseAmount`: `Number`
  - `taxRate`: `Number` (e.g. 0.15)
  - `taxAmount`: `Number`
  - `serviceCharge`: `Number`
  - `totalAmount`: `Number`
  - `postedBy`: `ObjectId` (Ref: `User`)
- `payments`: `[ObjectId]` (Ref: `Payment`)
- `totalCharges`: `Number`
- `totalPayments`: `Number`
- `balance`: `Number`
- `status`: `Enum` ['OPEN', 'SETTLED', 'CLOSED']

#### 3.8. `housekeeping_tasks` & `maintenance_tickets`
- Manages room turnaround workflows (`DIRTY` -> `ASSIGNED` -> `CLEANING` -> `INSPECTED` -> `READY`).
- Dispatches maintenance engineering tickets with priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and optional room locking (`MAINTENANCE`).

#### 3.9. `restaurant_orders`
- Point-of-Sale (POS) order tickets.
- Features `chargeToRoom` field which links to active in-house stay folios.

#### 3.10. `audit_logs`
- Append-only event store recording operator ID, action, target entity, timestamp, IP address, and JSON state snapshot.
