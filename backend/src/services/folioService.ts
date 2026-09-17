import { Folio, IFolio, IFolioItem, Payment, Reservation, Stay } from '../models/index.js';
import { Types } from 'mongoose';

export class FolioService {
  /**
   * Recalculates all subtotal, tax, service charge, discounts, paid total and remaining balance
   */
  public static async recalculateFolio(folioId: string | Types.ObjectId): Promise<IFolio> {
    const folio = await Folio.findById(folioId).populate('payments');
    if (!folio) {
      throw new Error(`Folio ${folioId} not found`);
    }

    let subtotal = 0;
    let taxTotal = 0;
    let serviceChargeTotal = 0;

    for (const item of folio.items) {
      subtotal += item.subtotal;
      taxTotal += item.tax;
      serviceChargeTotal += item.serviceCharge;
    }

    const discountTotal = folio.discountTotal || 0;
    const grandTotal = Math.max(0, subtotal + taxTotal + serviceChargeTotal - discountTotal);

    // Sum valid paid payments
    const payments = await Payment.find({
      folio: folio._id,
      status: 'PAID'
    });

    const paidTotal = payments.reduce((acc, p) => acc + p.amount, 0);
    const balance = Math.round((grandTotal - paidTotal) * 100) / 100;

    folio.subtotal = Math.round(subtotal * 100) / 100;
    folio.taxTotal = Math.round(taxTotal * 100) / 100;
    folio.serviceChargeTotal = Math.round(serviceChargeTotal * 100) / 100;
    folio.grandTotal = Math.round(grandTotal * 100) / 100;
    folio.paidTotal = Math.round(paidTotal * 100) / 100;
    folio.balance = balance;

    if (balance <= 0 && paidTotal > 0) {
      folio.status = 'SETTLED';
    } else if (folio.status === 'SETTLED' && balance > 0) {
      folio.status = 'OPEN';
    }

    folio.recalculatedAt = new Date();
    await folio.save();

    // Also update reservation pricing summary
    await Reservation.findByIdAndUpdate(folio.reservation, {
      'pricing.subtotal': folio.subtotal,
      'pricing.tax': folio.taxTotal,
      'pricing.serviceCharge': folio.serviceChargeTotal,
      'pricing.discount': folio.discountTotal,
      'pricing.total': folio.grandTotal,
      'pricing.paidAmount': folio.paidTotal,
      'pricing.balance': folio.balance,
      paymentStatus: balance <= 0 ? 'PAID' : (paidTotal > 0 ? 'PARTIAL' : 'PENDING')
    });

    return folio;
  }

  /**
   * Post a charge to a folio (e.g. from Restaurant POS, Minibar, Laundry, etc.)
   */
  public static async addCharge(
    folioId: string | Types.ObjectId,
    item: {
      category: IFolioItem['category'];
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate?: number;
      serviceChargeRate?: number;
      referenceId?: string;
      postedBy?: Types.ObjectId;
    }
  ): Promise<IFolio> {
    const folio = await Folio.findById(folioId);
    if (!folio) throw new Error('Folio not found');

    const taxRate = item.taxRate ?? 0.15; // 15% VAT default
    const serviceChargeRate = item.serviceChargeRate ?? 0.10; // 10% service charge default

    const subtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const serviceCharge = Math.round(subtotal * serviceChargeRate * 100) / 100;
    const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;

    folio.items.push({
      date: new Date(),
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal,
      tax,
      serviceCharge,
      total,
      referenceId: item.referenceId,
      postedBy: item.postedBy
    });

    await folio.save();
    return this.recalculateFolio(folio._id);
  }

  /**
   * Charge an order directly to an in-house room
   */
  public static async chargeRoomByRoomNumber(
    roomNumber: string,
    chargeDetails: {
      category: IFolioItem['category'];
      description: string;
      amount: number;
      referenceId?: string;
      postedBy?: Types.ObjectId;
    }
  ): Promise<{ folio: IFolio; stay: any }> {
    const stay = await Stay.findOne({ status: 'IN_HOUSE' })
      .populate({
        path: 'room',
        match: { roomNumber: roomNumber.trim() }
      })
      .populate('folio')
      .populate('guest');

    if (!stay || !stay.room) {
      throw new Error(`No checked-in guest found in Room ${roomNumber}`);
    }

    const folio = await this.addCharge(stay.folio._id, {
      category: chargeDetails.category,
      description: chargeDetails.description,
      quantity: 1,
      unitPrice: chargeDetails.amount,
      referenceId: chargeDetails.referenceId,
      postedBy: chargeDetails.postedBy
    });

    return { folio, stay };
  }
}
