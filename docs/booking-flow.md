# Booking Engine & Lifecycle Flow Documentation
## Grand View Hotel & Suites

### 1. Overview
The Grand View Hotel booking architecture guarantees zero double-booking across both public web visitors and front desk walk-ins through strict concurrency boundaries and server-side availability computation.

---

### 2. The 3-Step Public Booking Journey

```
  [ STEP 1: Search & Dates ]
            │
            ▼  GET /api/public/availability?checkIn=...&checkOut=...
  [ STEP 2: Live Room Selection ]
     - Computes real-time available units per category
     - Displays server-calculated base rate, 15% VAT, 10% Service Charge
            │
            ▼
  [ STEP 3: Guest Details & Guarantee ]
     - Guest identity (Passport/National ID, phone, email)
     - Guarantee selection: Telebirr / Chapa / Card / Pay at Hotel
            │
            ▼  POST /api/public/book
  [ STEP 4: Instant Confirmation & Itinerary ]
     - Generates booking reference (e.g. #GVH-89241)
     - Allocates inventory slot in PMS
     - Emits transactional confirmation voucher
```

---

### 3. State Machine Transitions

```
                    ┌─────────────────────────┐
                    │       CONFIRMED         │ ◄── Online Booking or Front Desk Walk-In
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │ Guest Arrives                 │ Guest Cancels / No-Show
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │      CHECKED_IN       │       │       CANCELLED       │
     │ - Room -> OCCUPIED    │       │ - Inventory released  │
     │ - Creates Stay & Folio│       └───────────────────────┘
     └───────────┬───────────┘
                 │
                 │ Guest Departs
                 ▼
     ┌───────────────────────┐
     │      CHECKED_OUT      │
     │ - Folio Settled       │
     │ - Room -> DIRTY       │
     │ - Queues Housekeeping │
     └───────────┬───────────┘
                 │
                 │ Housekeeper Inspects & Cleans
                 ▼
     ┌───────────────────────┐
     │       AVAILABLE       │
     │ - Ready for re-booking│
     └───────────────────────┘
```

---

### 4. Overlap & Double-Booking Prevention Logic

To determine if a room category has availability for a requested window $[C_{\text{in}}, C_{\text{out}})$:

1. **Calculate Total Inventory** for the Room Type ($N_{\text{total}}$).
2. **Count Conflicting Bookings** ($N_{\text{booked}}$):
   Query reservations where:
   - `roomTypeId == targetType`
   - `status IN ['CONFIRMED', 'CHECKED_IN']`
   - `checkInDate < C_out` AND `checkOutDate > C_in`
3. **Count Maintenance Blocks** ($N_{\text{maintenance}}$):
   Physical rooms of this type with status `MAINTENANCE` or `OUT_OF_SERVICE`.
4. **Determine Real Available Units**:
   $$\text{Available Units} = N_{\text{total}} - N_{\text{booked}} - N_{\text{maintenance}}$$
5. If $\text{Available Units} \le 0$, the room category is locked and cannot be booked for those dates.

---

### 5. Official Booking Voucher
Upon successful booking, the system creates a printable confirmation containing:
- Unique Booking ID (`#GVH-XXXXX`)
- QR Code for fast front-desk barcode scanning on arrival
- Clear dates, nights count, and room type specifications
- Itemized pricing breakdown: Room Net, 15% VAT, 10% Service Surcharge
- Check-in guidelines (2:00 PM standard check-in, valid passport/ID required)
- Complimentary airport shuttle transfer instructions (Bole International Airport)
