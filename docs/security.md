# Security & Role-Based Access Control (RBAC) Documentation
## Grand View Hotel & Suites

### 1. Authentication Architecture
- **Stateless JWT**: JSON Web Tokens signed with HMAC SHA-256 (`JWT_SECRET`).
- **Token Expiry**: 24 hours standard session lifetime.
- **Header Transport**: `Authorization: Bearer <token>`
- **Password Protection**: Salted Bcrypt hashing with 10 calculation rounds. Plaintext passwords are never logged or stored.

---

### 2. Role-Based Access Control (RBAC) Matrix

The system implements 7 specialized operational roles to enforce the principle of least privilege:

| Feature / Action | SUPER_ADMIN | HOTEL_MANAGER | RECEPTIONIST | ACCOUNTANT | RESTAURANT_STAFF | HOUSEKEEPING | MAINTENANCE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Front Desk Board** | Read/Write | Read/Write | Read/Write | Read | Read | Read | Read |
| **Guest Check-In / Out** | Yes | Yes | Yes | No | No | No | No |
| **Room Transfer** | Yes | Yes | Yes | No | No | No | No |
| **Tape Chart Calendar** | Read/Write | Read/Write | Read/Write | Read | No | Read | Read |
| **Manage Room Inventory** | Yes | Yes | No | No | No | No | No |
| **Folio Billing / Ledger** | Full | Full | Read/Post | Full | Post-only | No | No |
| **Apply Folio Discounts** | Yes | Yes | No | Yes | No | No | No |
| **Restaurant POS Catalog** | Full | Full | Read | Read | Read/Write | No | No |
| **Direct Room Charge** | Yes | Yes | Yes | No | Yes | No | No |
| **Housekeeping Stages** | Yes | Yes | Read | No | No | Read/Write | No |
| **Maintenance Tickets** | Yes | Yes | Report | No | Report | Report | Read/Write |
| **Financial Reports** | Full | Full | No | Full | No | No | No |
| **Staff & Access Control** | Full | Full | No | No | No | No | No |
| **Hotel Operational Config** | Full | Full | No | No | No | No | No |
| **Audit Logs Inspection** | Yes | Yes | No | No | No | No | No |

---

### 3. Concurrency & Race Condition Mitigation
To eliminate race conditions when two customers attempt to book the last available suite simultaneously:
1. Availability is verified at query time and immediately locked inside an ACID transaction during reservation creation.
2. The availability service uses MongoDB `$match` and `$count` aggregations to guarantee atomic inventory evaluation.

---

### 4. Immutable Audit Trail
Every critical operational event is automatically captured in the `audit_logs` collection:
- Check-ins and check-outs
- Room transfers
- Manual price or status overrides
- Folio charge additions and payment settlements
- Staff user creation and deactivation

Each audit event stores:
- `timestamp`: UTC ISO date
- `userId`: Operator ObjectId and role snapshot
- `action`: Specific action code (e.g. `CHECK_IN`, `ROOM_TRANSFER`)
- `entity`: Target domain (e.g. `Room`, `Stay`, `Folio`)
- `details`: Comprehensive before/after state diff or transaction payload
- `ipAddress`: Client network IP address
