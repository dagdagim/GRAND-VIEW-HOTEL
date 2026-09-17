# REST API Specification Documentation
## Grand View Hotel & Suites — Backend Endpoints

### 1. Base URL & Authentication
- **Base URL**: `http://localhost:5000/api`
- **Protocol**: HTTP/1.1 or HTTP/2 over TLS
- **Authentication**: JWT Bearer token in the `Authorization` header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Error Format**:
  ```json
  {
    "status": "error",
    "message": "Specific human-readable error description",
    "code": "INVALID_CREDENTIALS"
  }
  ```

---

### 2. Public Endpoints (No Auth Required)

#### 2.1. Check Room Availability & Rates
- **Method**: `GET /public/availability`
- **Query Parameters**:
  - `checkIn` (YYYY-MM-DD, e.g. `2026-09-14`)
  - `checkOut` (YYYY-MM-DD, e.g. `2026-09-16`)
  - `adults` (Integer, default 1)
  - `roomType` (Optional room type code)
- **Response `200 OK`**:
  ```json
  {
    "status": "success",
    "data": {
      "checkIn": "2026-09-14",
      "checkOut": "2026-09-16",
      "nights": 2,
      "availableRoomTypes": [
        {
          "_id": "66e4a1b...",
          "code": "JUNIOR",
          "name": "Junior Suite",
          "basePrice": 19000,
          "availableCount": 5,
          "totalNightsPrice": 38000,
          "taxAmount": 5700,
          "serviceCharge": 3800,
          "grandTotal": 47500
        }
      ]
    }
  }
  ```

#### 2.2. Create Direct Public Booking
- **Method**: `POST /public/book`
- **Request Body**:
  ```json
  {
    "roomTypeId": "66e4a1b...",
    "checkInDate": "2026-09-14",
    "checkOutDate": "2026-09-16",
    "adults": 2,
    "children": 0,
    "guest": {
      "firstName": "Bethlehem",
      "lastName": "Tadesse",
      "email": "bethlehem@example.com",
      "phone": "+251 91 223 4455",
      "nationality": "Ethiopian",
      "idType": "PASSPORT",
      "idNumber": "EP0987654"
    },
    "paymentMethod": "TELEBIRR",
    "specialRequests": "High floor non-smoking"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "status": "success",
    "data": {
      "bookingNumber": "GVH-89241",
      "status": "CONFIRMED",
      "grandTotal": 47500,
      "checkInDate": "2026-09-14",
      "checkOutDate": "2026-09-16",
      "roomType": "Junior Suite"
    }
  }
  ```

#### 2.3. Retrieve Booking Itinerary / Voucher
- **Method**: `GET /public/bookings/:bookingNumber`
- **Response `200 OK`**: Returns voucher itinerary, breakdown of taxes, cancellation rules, and QR verification metadata.

---

### 3. Authentication & Staff Operations

#### 3.1. Staff Login
- **Method**: `POST /auth/login`
- **Body**: `{ "email": "manager@grandviewhotel.com", "password": "ManagerPass123!" }`
- **Response `200 OK`**: Returns `{ "token": "...", "user": { "id": "...", "name": "...", "role": "HOTEL_MANAGER" } }`

#### 3.2. Current Session User
- **Method**: `GET /auth/me`

#### 3.3. Staff Directory & Access
- **Method**: `GET /auth/staff` (Roles: `SUPER_ADMIN`, `HOTEL_MANAGER`)
- **Method**: `POST /auth/staff` (Create operational account)
- **Method**: `PATCH /auth/staff/:id/status` (Toggle `isActive`)

---

### 4. Front Desk & Room Inventory

#### 4.1. Front Desk Interactive Board
- **Method**: `GET /pms/frontdesk/board`
- **Response `200 OK`**: Returns all 32 rooms organized by floors 1-4 with active guest stays, statuses (`AVAILABLE`, `OCCUPIED`, `DIRTY`, `MAINTENANCE`), and today's expected arrivals/departures.

#### 4.2. Express Check-In
- **Method**: `POST /pms/frontdesk/check-in`
- **Body**:
  ```json
  {
    "reservationId": "66e4a2c...",
    "roomId": "66e4a2d...",
    "keyCardsIssued": 2,
    "idVerified": true
  }
  ```
- **Action**: Transitions reservation to `CHECKED_IN`, room to `OCCUPIED`, creates active `Stay` and initial room night charges on `Folio`.

#### 4.3. Express Check-Out
- **Method**: `POST /pms/frontdesk/check-out`
- **Body**:
  ```json
  {
    "stayId": "66e4a2e...",
    "paymentDetails": {
      "method": "CASH",
      "amount": 12500
    }
  }
  ```
- **Action**: Transitions stay to `CHECKED_OUT`, room to `DIRTY`, and auto-queues a `HousekeepingTask` with priority `NORMAL`.

#### 4.4. Room Transfer (Mid-Stay Move)
- **Method**: `POST /pms/frontdesk/transfer-room`
- **Body**: `{ "stayId": "...", "targetRoomId": "...", "reason": "Guest requested balcony suite" }`
- **Action**: Previous room transitions to `DIRTY`, new room transitions to `OCCUPIED`, folio billing updated.

---

### 5. Multi-Room Timeline Tape Chart
- **Method**: `GET /pms/calendar/tape-chart`
- **Query**: `startDate=2026-09-01&days=14`
- **Response `200 OK`**: Returns horizontal matrix of 32 rooms with array of overlapping reservation blocks for real-time visualization.

---

### 6. Folio Ledger & Invoicing

#### 6.1. Get Folio Ledger Details
- **Method**: `GET /pms/folios/:id`
- **Response `200 OK`**: Itemized charges, VAT breakdown, payments, and live balance.

#### 6.2. Post Custom Folio Charge
- **Method**: `POST /pms/folios/:id/charges`
- **Body**: `{ "department": "MINIBAR", "description": "Highland Spring Water & Wine", "baseAmount": 1200 }`

#### 6.3. Record Folio Payment
- **Method**: `POST /pms/folios/:id/payments`
- **Body**: `{ "method": "CREDIT_CARD", "amount": 15000, "reference": "TXN-90219" }`

#### 6.4. Generate Official VAT Tax Invoice
- **Method**: `GET /pms/folios/:id/invoice`

---

### 7. Restaurant POS & Direct Room Charging

#### 7.1. Get Menu Catalog
- **Method**: `GET /pms/restaurant/catalog`

#### 7.2. Create Restaurant Ticket
- **Method**: `POST /pms/restaurant/orders`
- **Body**:
  ```json
  {
    "tableNumber": 4,
    "items": [
      { "menuItemId": "...", "name": "Bole Prime Ribeye", "price": 1450, "quantity": 2 }
    ],
    "subtotal": 2900,
    "tax": 435,
    "serviceCharge": 290,
    "total": 3625
  }
  ```

#### 7.3. Direct Charge Order to Room Folio
- **Method**: `POST /pms/restaurant/orders/:id/charge-room`
- **Body**: `{ "roomNumber": "304" }`
- **Action**: Validates Room 304 is `OCCUPIED`, locates in-house `Stay` and `Folio`, posts the restaurant charge item, and marks order `PAID_ROOM_CHARGE`.

---

### 8. Housekeeping & Maintenance

- `GET /pms/housekeeping/tasks`: Lists active room cleaning tickets.
- `PATCH /pms/housekeeping/tasks/:id/stage`: Advances cleaning stage (`DIRTY` -> `ASSIGNED` -> `CLEANING` -> `INSPECTED` -> `READY`). When set to `READY`, the associated physical room automatically transitions to `AVAILABLE`.
- `GET /pms/maintenance/tickets`: Lists engineering tickets.
- `POST /pms/maintenance/tickets`: Reports defect and optionally sets room to `MAINTENANCE`.
