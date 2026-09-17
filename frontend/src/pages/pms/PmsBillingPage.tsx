import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  DollarSign, 
  Printer, 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  User, 
  AlertCircle 
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';

export const PmsBillingPage: React.FC = () => {
  const { formatPrice } = useCurrency();

  const [folios, setFolios] = useState<any[]>([]);
  const [selectedFolio, setSelectedFolio] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Add charge modal
  const [addChargeModalOpen, setAddChargeModalOpen] = useState<boolean>(false);
  const [chargeCategory, setChargeCategory] = useState<string>('MINIBAR');
  const [chargeDesc, setChargeDesc] = useState<string>('');
  const [chargeQty, setChargeQty] = useState<number>(1);
  const [chargeUnitPrice, setChargeUnitPrice] = useState<string>('0');

  // Record payment modal
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Invoice view modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  const fetchFolios = async () => {
    setLoading(true);
    try {
      // Get all active reservations with folios
      const res = await api.get('/pms/reservations', { params: { limit: 50 } });
      const reservations = res.data.reservations || [];

      // Fetch details for first few reservations to extract folios
      const loadedFolios: any[] = [];
      for (const r of reservations.slice(0, 15)) {
        try {
          const detailRes = await api.get(`/pms/reservations/${r._id}`);
          if (detailRes.data.folio) {
            loadedFolios.push({
              ...detailRes.data.folio,
              reservationData: r
            });
          }
        } catch (e) {}
      }

      setFolios(loadedFolios);
      if (loadedFolios.length > 0 && !selectedFolio) {
        setSelectedFolio(loadedFolios[0]);
      }
    } catch (e) {
      console.error('Failed to load folios', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolios();
  }, []);

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolio) return;

    try {
      const res = await api.post(`/pms/folios/${selectedFolio._id}/charges`, {
        category: chargeCategory,
        description: chargeDesc,
        quantity: Number(chargeQty),
        unitPrice: Number(chargeUnitPrice)
      });
      setSelectedFolio(res.data.folio);
      setAddChargeModalOpen(false);
      setChargeDesc('');
      setChargeUnitPrice('0');
      fetchFolios();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post charge');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolio) return;

    try {
      const res = await api.post(`/pms/folios/${selectedFolio._id}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod,
        notes: paymentNotes
      });
      setSelectedFolio(res.data.folio);
      setRecordPaymentModalOpen(false);
      setPaymentAmount('');
      fetchFolios();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleOpenInvoice = async (folioId: string) => {
    try {
      const res = await api.get(`/pms/folios/${folioId}/invoice`);
      setInvoiceData(res.data);
      setInvoiceModalOpen(true);
    } catch (e) {
      alert('Failed to load invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-gold-dark" />
            <h1 className="font-serif text-2xl font-bold text-slate-900">Billing & Guest Folio Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time room charges, restaurant posting, minibar/laundry additions, payments, and official VAT invoices.
          </p>
        </div>
      </div>

      {/* WORKSPACE: LEFT FOLIOS LIST / RIGHT FOLIO LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 4 COLS: RECENT FOLIOS */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Stay Folios ({folios.length})
          </span>

          <div className="max-h-[600px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading folios...</div>
            ) : (
              folios.map((fol) => {
                const isSelected = selectedFolio?._id === fol._id;
                const rData = fol.reservationData;

                return (
                  <div
                    key={fol._id}
                    onClick={() => setSelectedFolio(fol)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-gold bg-amber-50/20 shadow-xs ring-1 ring-gold/50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          {rData?.guest?.fullName || 'Guest'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{fol.folioNumber} • Room {rData?.assignedRoom?.roomNumber || '—'}
                        </span>
                      </div>
                      <StatusBadge status={fol.status} />
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total: {formatPrice(fol.grandTotal || 0)}</span>
                      <span className={`font-bold ${fol.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        Bal: {formatPrice(fol.balance || 0)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT 8 COLS: DETAILED FOLIO LEDGER */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {selectedFolio ? (
            <>
              {/* Folio Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Folio Ledger
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-slate-900 mt-0.5">
                    #{selectedFolio.folioNumber}
                  </h2>
                  <span className="text-xs text-slate-600 font-medium block mt-0.5">
                    Guest: <strong>{selectedFolio.reservationData?.guest?.fullName}</strong> ({selectedFolio.reservationData?.guest?.phone})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setAddChargeModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>Post Charge</span>
                  </button>

                  <button
                    onClick={() => setRecordPaymentModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Apply Payment</span>
                  </button>

                  <button
                    onClick={() => handleOpenInvoice(selectedFolio._id)}
                    className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Itemized Charges & Services
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedFolio.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {item.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3">{item.quantity}</td>
                          <td className="py-2.5 px-3">{formatPrice(item.unitPrice)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 text-right">
                            {formatPrice(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments Applied Table */}
              {selectedFolio.payments?.length > 0 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Settlements & Payments Applied
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Transaction ID</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedFolio.payments.map((pmt: any) => (
                          <tr key={pmt._id}>
                            <td className="py-2 px-3 text-slate-500">{new Date(pmt.createdAt || Date.now()).toLocaleDateString()}</td>
                            <td className="py-2 px-3 font-mono font-semibold">{pmt.transactionId}</td>
                            <td className="py-2 px-3 uppercase font-semibold">{pmt.paymentMethod}</td>
                            <td className="py-2 px-3"><StatusBadge status={pmt.status} /></td>
                            <td className="py-2 px-3 font-bold text-emerald-700 text-right">
                              {formatPrice(pmt.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary Balances Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(selectedFolio.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>VAT (15%):</span>
                  <span>{formatPrice(selectedFolio.taxTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge (10%):</span>
                  <span>{formatPrice(selectedFolio.serviceChargeTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>{formatPrice(selectedFolio.grandTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                  <span>Total Paid to Date:</span>
                  <span>{formatPrice(selectedFolio.paidTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
                  <span>Outstanding Balance:</span>
                  <span className={selectedFolio.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    {formatPrice(selectedFolio.balance || 0)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-slate-400">Select a folio to inspect ledger.</div>
          )}
        </div>
      </div>

      {/* POST CHARGE MODAL */}
      <Modal
        isOpen={addChargeModalOpen}
        onClose={() => setAddChargeModalOpen(false)}
        title={`Post Charge to Folio #${selectedFolio?.folioNumber}`}
      >
        <form onSubmit={handleAddCharge} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Charge Category
            </label>
            <select
              value={chargeCategory}
              onChange={(e) => setChargeCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="MINIBAR">Minibar Consumables</option>
              <option value="LAUNDRY">Laundry & Dry Cleaning</option>
              <option value="SPA">Zoma Spa & Wellness</option>
              <option value="TRANSPORT">Private Transport / Airport</option>
              <option value="ROOM_SERVICE">Room Service</option>
              <option value="OTHER">Custom Service / Sundry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2x Mineral Water, 1x Toblerone"
              value={chargeDesc}
              onChange={(e) => setChargeDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                value={chargeQty}
                onChange={(e) => setChargeQty(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unit Price (ETB) *
              </label>
              <input
                type="number"
                required
                value={chargeUnitPrice}
                onChange={(e) => setChargeUnitPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setAddChargeModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold/40 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Post to Folio
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        title={`Record Settlement on Folio #${selectedFolio?.folioNumber}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount (ETB) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Current balance: ETB {selectedFolio?.balance || 0}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="CASH">Cash (Front Desk)</option>
              <option value="CREDIT_CARD">Credit / Debit Card</option>
              <option value="TELEBIRR">Telebirr Mobile Payment</option>
              <option value="CHAPA">Chapa</option>
              <option value="BANK_TRANSFER">Bank Wire Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. CBE Slip #99281"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setRecordPaymentModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE GUEST INVOICE MODAL */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Official Guest Folio Tax Invoice"
        maxWidth="3xl"
      >
        {invoiceData && (
          <div className="space-y-6 text-xs text-slate-900">
            {/* Action top */}
            <div className="no-print flex justify-end">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Invoice</span>
              </button>
            </div>

            {/* Invoice Print Container */}
            <div className="p-8 border border-slate-200 rounded-xl bg-white space-y-6">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-slate-900">
                    {invoiceData.hotel?.hotelName || 'Grand View Hotel & Suites'}
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    {invoiceData.hotel?.legalName} • Bole Corridor, Addis Ababa
                  </p>
                  <p className="text-slate-500 text-xs">TIN: 0048192841 • VAT Reg: ET-9920194</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">TAX INVOICE #</span>
                  <span className="font-serif text-xl font-bold text-slate-900 block">{invoiceData.invoiceNumber}</span>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    Date: {new Date(invoiceData.invoiceDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Guest & Stay Details */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="font-bold text-[10px] uppercase text-slate-400 block">Billed To:</span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {invoiceData.guest?.fullName}
                  </span>
                  <span className="text-slate-600 block">{invoiceData.guest?.email}</span>
                  <span className="text-slate-600 block">{invoiceData.guest?.phone}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[10px] uppercase text-slate-400 block">Room & Booking:</span>
                  <span className="font-bold text-slate-900 text-sm block">
                    Room {invoiceData.room?.roomNumber || '—'}
                  </span>
                  <span className="text-slate-600 block">Booking #{invoiceData.reservation?.bookingNumber}</span>
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 uppercase text-[10px] text-slate-400 font-bold">
                  <tr>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Rate</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceData.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{item.description}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">{formatPrice(item.unitPrice)}</td>
                      <td className="py-2 text-right font-bold">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-4 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(invoiceData.totals?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>VAT (15%):</span>
                  <span>{formatPrice(invoiceData.totals?.taxTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge (10%):</span>
                  <span>{formatPrice(invoiceData.totals?.serviceChargeTotal || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
                  <span>Invoice Total:</span>
                  <span>{formatPrice(invoiceData.totals?.grandTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Total Payments Applied:</span>
                  <span>{formatPrice(invoiceData.totals?.paidTotal || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Balance Due:</span>
                  <span className={invoiceData.totals?.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    {formatPrice(invoiceData.totals?.balance || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
