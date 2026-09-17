# UI/UX Design System & Ergonomics Documentation
## Grand View Hotel & Suites

### 1. Design Philosophy

The application features a dual-interface architectural paradigm:
1. **Public Guest Experience**: High-impact, luxury editorial aesthetic designed to inspire confidence, convey five-star elegance, and streamline booking conversion.
2. **Back-Office PMS**: High-density, professional operational cockpit designed for front desk staff who work with high transaction volume for 8 hours daily. Avoids unnecessary scroll depth, oversized padding, or gratuitous motion.

---

### 2. Color Palette & Semantics

```
Brand Primary & Luxury Accents:
  Navy Deep       : #0f172a (Primary text, executive surfaces, header bars)
  Navy Slate      : #1e293b (PMS sidebar navigation, dark contrast accents)
  Warm Cream      : #fcfaf7 (Background neutral, luxury editorial canvas)
  Gold Primary    : #b38728 (Primary CTA, luxury emblems, highlight borders)
  Gold Light      : #d4af37 (Secondary gold, badge accents)
  Gold Glow       : #b387281a (Subtle backlights and active item highlights)

Hospitality Status Semantics:
  AVAILABLE       : Emerald (#059669 / bg-emerald-50) — Room ready for immediate guest arrival
  OCCUPIED        : Blue    (#2563eb / bg-blue-50)    — Active in-house guest residency
  DIRTY           : Amber   (#d97706 / bg-amber-50)   — Checked out, awaiting housekeeping
  CLEANING        : Teal    (#0d9488 / bg-teal-50)    — Attendant actively servicing room
  INSPECTED       : Indigo  (#4f46e5 / bg-indigo-50)  — Supervisor final verification passed
  MAINTENANCE     : Purple  (#7c3aed / bg-purple-50)  — Engineering hold, excluded from sales
```

---

### 3. Typography Hierarchy

- **Headings & Brand Title**: `Playfair Display`, serif. Evokes timeless hospitality, luxury boutique character, and diplomatic prestige.
- **Body & Tabular Figures**: `Inter`, sans-serif. Highly readable at small font sizes (11px–13px) with tabular lining figures for numerical columns, prices, and timestamps.

---

### 4. High-Density PMS Ergonomics

1. **Floor-by-Floor Grid View**:
   - 32 rooms displayed in compact 4-floor layouts.
   - 1-click quick action menus on each room card (Check-in, Check-out, Folio inspection, Room transfer).
2. **Horizontal Tape Chart**:
   - Continuous 14/21/30-day horizontal calendar.
   - Rooms grouped on vertical axis by floor and category.
   - Clickable reservation blocks showing guest name, nights, and status.
3. **Instant Demo Role Switcher**:
   - Login page offers 1-click instant login for all roles (Receptionist, Manager, Restaurant, Housekeeping, Admin) for friction-free demonstration and training.
