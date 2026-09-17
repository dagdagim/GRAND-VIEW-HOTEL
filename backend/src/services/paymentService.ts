import { Payment, IPayment, Folio, Reservation, PaymentProvider, PaymentGatewayStatus } from '../models/index.js';
import { FolioService } from './folioService.js';
import { Types } from 'mongoose';

export interface InitializePaymentParams {
  folioId: string;
  reservationId: string;
  guestId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentProvider;
  notes?: string;
  processedBy?: string;
}

export class PaymentService {
  /**
   * Initializes a payment record in PENDING or PROCESSING state
   */
  public static async initializePayment(params: InitializePaymentParams): Promise<IPayment> {
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = new Payment({
      transactionId,
      folio: params.folioId,
      reservation: params.reservationId,
      guest: params.guestId,
      amount: params.amount,
      currency: params.currency || 'ETB',
      paymentMethod: params.paymentMethod,
      status: 'PENDING',
      notes: params.notes,
      processedBy: params.processedBy
    });

    await payment.save();

    // Link to folio
    await Folio.findByIdAndUpdate(params.folioId, {
      $addToSet: { payments: payment._id }
    });

    return payment;
  }

  /**
   * Verifies and confirms a payment. For cash/card at front desk or webhook confirmation from Chapa/Telebirr
   */
  public static async confirmPayment(
    paymentId: string,
    verificationData?: {
      providerReference?: string;
      status?: PaymentGatewayStatus;
      metadata?: any;
    }
  ): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    if (payment.status === 'PAID') {
      return payment; // Already confirmed
    }

    payment.status = verificationData?.status || 'PAID';
    payment.providerReference = verificationData?.providerReference || `VERIFIED-${Date.now()}`;
    payment.paidAt = new Date();
    if (verificationData?.metadata) {
      payment.metadata = verificationData.metadata;
    }

    await payment.save();

    // Recalculate Folio balances
    await FolioService.recalculateFolio(payment.folio);

    return payment;
  }

  /**
   * Record a refund
   */
  public static async processRefund(
    paymentId: string,
    refundAmount: number,
    reason: string
  ): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'PAID') throw new Error('Can only refund paid transactions');

    payment.status = 'REFUNDED';
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();

    await payment.save();
    await FolioService.recalculateFolio(payment.folio);

    return payment;
  }
}
