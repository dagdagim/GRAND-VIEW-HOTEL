# Financial Folio, Payments & Taxation Documentation
## Grand View Hotel & Suites

### 1. Folio Ledger Architecture

In hospitality accounting, the **Folio** is the official sub-ledger that records all economic transactions between the guest and the property.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GUEST FOLIO LEDGER (#FOL-2026-0042)                    │
├──────────────┬──────────────┬──────────────────┬──────────────┬─────────────┤
│ DATE         │ DEPARTMENT   │ DESCRIPTION      │ CHARGES      │ PAYMENTS    │
├──────────────┼──────────────┼──────────────────┼──────────────┼─────────────┤
│ 2026-09-13   │ ROOM         │ Junior Suite     │ ETB 19,000   │ -           │
│ 2026-09-13   │ RESTAURANT   │ Table 4 Room Chg │ ETB  3,625   │ -           │
│ 2026-09-14   │ ROOM         │ Junior Suite     │ ETB 19,000   │ -           │
│ 2026-09-14   │ MINIBAR      │ Sparkling Water  │ ETB  1,200   │ -           │
│ 2026-09-14   │ PAYMENT      │ Telebirr Deposit │ -            │ ETB 20,000  │
├──────────────┴──────────────┴──────────────────┴──────────────┼─────────────┤
│ TOTAL BILLED (Inc. VAT & Service Charge):                      │ ETB 53,531  │
│ TOTAL PAYMENTS RECORDED:                                       │ ETB 20,000  │
│ OUTSTANDING BALANCE DUE AT CHECKOUT:                           │ ETB 33,531  │
└────────────────────────────────────────────────────────────────┴─────────────┘
```

---

### 2. Fiscal Taxation & Service Charges
Grand View Hotel implements standard Ethiopian hospitality tax compliance:

1. **Value Added Tax (VAT)**:
   $$\text{VAT} = 15\% \times \text{Base Amount}$$
2. **Hotel Service Charge**:
   $$\text{Service Charge} = 10\% \times \text{Base Amount}$$
3. **Combined Surcharge**:
   $$\text{Gross Total} = \text{Base Amount} \times 1.25$$

All line items (Accommodation, F&B, Minibar, Laundry) record the explicit base rate, tax amount, and service charge so that tax audits can generate compliant breakdown statements.

---

### 3. Payment Methods & Gateway Support

The system supports multiple settlement channels:
- **Telebirr**: Fast QR mobile money payment standard in Ethiopia.
- **Chapa**: Local payment gateway supporting debit cards, CBE Birr, and mobile banking.
- **Credit / Debit Cards**: Visa, Mastercard, and UnionPay.
- **Cash**: Handled at Front Desk with automated receipt number generation.
- **Direct Room Charge (F&B / POS)**:
  - Validates that the target room is currently `OCCUPIED`.
  - Locates the active in-house stay and links the itemized order to the master folio.

---

### 4. Checkout & Invoice Generation
During Express Check-out:
1. The system checks if `Folio.balance == 0`.
2. If an outstanding balance exists, the front desk operator is prompted to record settlement (Cash, Card, or Mobile Money).
3. Once settled, the folio transitions to `SETTLED`.
4. The system emits an official printable **VAT Tax Invoice** containing the hotel TIN number, guest details, itemized dates, and fiscal stamp.
