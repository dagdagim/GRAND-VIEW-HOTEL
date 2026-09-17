# Grand View Hotel & Suites — Property Management System (PMS) & Direct Booking Engine

An enterprise-grade, full-stack Hotel Property Management System (PMS) and public guest booking engine built with Node.js, Express, TypeScript, MongoDB, React, and TailwindCSS.

![Grand View Hotel](https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Features Overview

### 🏨 1. Public Guest Experience & Direct Booking Engine
- **Direct Reservations**: Real-time room availability calendar, live rate calculation with 15% VAT and 10% Service Charge.
- **Chapa Payment Gateway Integration**: Seamless checkout via Ethiopia's premier payment platform with automated webhook and synchronous payment status verification.
- **In-Room Guest QR Portal**: Guests can scan in-room QR codes to request room cleaning, extra towels, maintenance repairs, and order in-room dining directly to their room folio.
- **Automated Email Notifications**: HTML booking confirmations dispatched upon payment verification.

### 💼 2. Front Desk & Reception Management
- **Tape Chart & Grid View**: Interactive visual occupancy timeline with real-time room status tracking.
- **Guest Folio & Billing**: Real-time folio management, room charges, split payments, deposits, and invoice generation.
- **1-Click Express Check-In / Check-Out**: Fast guest turnaround with automatic key status and room inventory updates.
- **In-Room QR Tent Card Generator**: Front Desk can print personalized QR tent cards for any room with 1-click.

### 🧹 3. Housekeeping Operations
- **Real-Time Kanban Board**: Task stages (`DIRTY` ➔ `CLEANING` ➔ `INSPECTED` ➔ `READY`).
- **Automated State Machine**: Guest check-out automatically transitions room to `DIRTY` and dispatches housekeeping tasks. Once inspected, rooms become instantly `AVAILABLE` for front desk and online booking.

### 🛠️ 4. Engineering & Maintenance
- **Ticket Lifecycle**: Log, triage, assign technicians, and track resolution of room and facility issues.
- **Emergency Priority**: Fast-track priority tagging for critical guest room maintenance requests.

### 🍽️ 5. Restaurant POS & Dining
- **Order Management & Table Service**: Full food & beverage point of sale.
- **Cross-Department Folio Charging**: Ability to charge dining orders directly to checked-in guest room folios.

### 📊 6. Analytics & Reports
- **KPI Metrics**: Real-time ADR (Average Daily Rate), RevPAR (Revenue Per Available Room), Occupancy rates, and financial reports.
- **Audit Trails**: Security audit logging across all staff actions.

---

## 🚀 Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), JWT, Nodemailer, Chapa API
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Lucide Icons, React Router v6
- **Architecture**: RESTful API, Modular Controller-Service-Repository pattern

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance or MongoDB Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/dagdagim/GRAND-VIEW-HOTEL.git
cd GRAND-VIEW-HOTEL
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your MongoDB URI, JWT secret, and Chapa keys in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and the backend API on `http://localhost:5000`.

---

## 🔑 Demo Staff Accounts

Visit `http://localhost:5173/pms/login` and use the 1-click demo login buttons:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Front Desk Receptionist** | `receptionist@grandviewhotel.com` | `ReceptionPass123!` |
| **Hotel Duty Manager** | `manager@grandviewhotel.com` | `ManagerPass123!` |
| **Super Administrator** | `admin@grandviewhotel.com` | `AdminPass123!` |
| **Restaurant POS** | `restaurant@grandviewhotel.com` | `RestaurantPass123!` |
| **Housekeeping Supervisor** | `housekeeping@grandviewhotel.com` | `HousekeepingPass123!` |

---

## 📄 License
Private property of Grand View Hotel & Suites. All rights reserved.
