import axios from 'axios';
import { Payment, Reservation, Folio, Notification, AuditLog } from '../models/index.js';
import { FolioService } from './folioService.js';
import { EmailService } from './emailService.js';

export interface InitializeChapaParams {
  amount: number;
  currency?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  txRef?: string;
  callbackUrl?: string;
  returnUrl?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export class ChapaService {
  private static getSecretKey(): string {
    return process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-EzF8SkHTiEva3p8xXcwKREFNpIHCq5hu';
  }

  private static getPublicKey(): string {
    return process.env.CHAPA_PUBLIC_KEY || 'CHAPUBK_TEST-F8wVF0CiDxcc6xAut5vm1oFKM4VCVCG9';
  }

  private static getInitializeUrl(): string {
    return process.env.CHAPA_URL || 'https://api.chapa.co/v1/transaction/initialize';
  }

  private static getVerifyUrl(): string {
    return process.env.CHAPA_VERIFY_URL || 'https://api.chapa.co/v1/transaction/verify/';
  }

  /**
   * Initialize a hosted payment checkout session with Chapa API
   */
  public static async initializeTransaction(params: InitializeChapaParams): Promise<{
    checkoutUrl: string;
    txRef: string;
    raw: any;
  }> {
    const secretKey = this.getSecretKey();
    const initializeUrl = this.getInitializeUrl();

    const txRef = params.txRef || `tx-gvh-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    const validEmail = (params.email && emailRegex.test(params.email.trim()))
      ? params.email.trim()
      : 'guest.grandview@gmail.com';

    let cleanPhone: string | undefined = undefined;
    if (params.phone) {
      const digits = params.phone.replace(/[^0-9]/g, '');
      if (digits.length >= 9) {
        cleanPhone = digits.startsWith('251') ? `0${digits.slice(3)}` : (digits.startsWith('0') ? digits : `0${digits}`);
      }
    }

    const payload: any = {
      amount: String(params.amount),
      currency: params.currency || 'ETB',
      email: validEmail,
      first_name: (params.firstName || 'Guest').replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Guest',
      last_name: (params.lastName || 'Customer').replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Customer',
      tx_ref: txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      customization: {
        title: (params.title || 'Grand View').replace(/[^a-zA-Z0-9\s._-]/g, '').trim().slice(0, 16),
        description: (params.description || 'Room Booking').replace(/[^a-zA-Z0-9\s._-]/g, '').trim().slice(0, 50)
      },
      meta: params.metadata || {}
    };

    if (cleanPhone) {
      payload.phone_number = cleanPhone;
    }

    try {
      const response = await axios.post(initializeUrl, payload, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data && response.data.status === 'success') {
        return {
          checkoutUrl: response.data.data.checkout_url,
          txRef,
          raw: response.data
        };
      } else {
        throw new Error(response.data?.message || 'Chapa initialization failed.');
      }
    } catch (error: any) {
      console.error('Chapa transaction initialize error:', error.response?.data || error.message);
      const rawMsg = error.response?.data?.message;
      const errText = typeof rawMsg === 'object' 
        ? JSON.stringify(rawMsg) 
        : (typeof rawMsg === 'string' ? rawMsg : error.message);
      throw new Error(errText || 'Unable to connect to Chapa payment gateway.');
    }
  }

  /**
   * Verify a transaction with Chapa API by tx_ref
   */
  public static async verifyTransaction(txRef: string): Promise<{
    success: boolean;
    data: any;
    raw: any;
  }> {
    const secretKey = this.getSecretKey();
    const verifyUrl = `${this.getVerifyUrl()}${txRef}`;

    try {
      const response = await axios.get(verifyUrl, {
        headers: {
          Authorization: `Bearer ${secretKey}`
        },
        timeout: 15000
      });

      const isSuccess = response.data && response.data.status === 'success';
      return {
        success: isSuccess,
        data: response.data?.data,
        raw: response.data
      };
    } catch (error: any) {
      console.error(`Chapa verify error for tx_ref ${txRef}:`, error.response?.data || error.message);
      return {
        success: false,
        data: null,
        raw: error.response?.data || { error: error.message }
      };
    }
  }

  /**
   * Verifies Chapa transaction and automatically updates Payment, Folio, and Reservation states in PMS
   */
  public static async verifyAndConfirmPayment(txRef: string): Promise<{
    verified: boolean;
    reservation?: any;
    payment?: any;
    message: string;
  }> {
    const verification = await this.verifyTransaction(txRef);

    if (!verification.success) {
      return {
        verified: false,
        message: 'Transaction verification returned non-success status from Chapa.'
      };
    }

    const chapaData = verification.data;

    // Find Payment by transactionId, providerReference or metadata.tx_ref
    let payment = await Payment.findOne({
      $or: [
        { transactionId: txRef },
        { providerReference: txRef },
        { 'metadata.tx_ref': txRef }
      ]
    });

    // Extract booking number using regex to handle multiple prefixes (e.g. tx-gvh-gvh-93132-...)
    const bookingMatch = txRef.match(/gvh-\d+/i);
    const extractedBookingNumber = bookingMatch ? bookingMatch[0].toUpperCase() : null;

    // Find Reservation by payment, metadata, reference, or booking number
    let reservation: any = null;
    if (payment?.reservation) {
      reservation = await Reservation.findById(payment.reservation).populate('roomType guest assignedRoom');
    } else if (chapaData?.meta?.reservationId) {
      reservation = await Reservation.findById(chapaData.meta.reservationId).populate('roomType guest assignedRoom');
    }

    if (!reservation) {
      reservation = await Reservation.findOne({
        $or: [
          { paymentGatewayReference: txRef },
          ...(extractedBookingNumber ? [{ bookingNumber: extractedBookingNumber }] : [])
        ]
      }).populate('roomType guest assignedRoom');
    }

    // If reservation found and payment not yet linked
    if (reservation && !payment) {
      payment = await Payment.findOne({ reservation: reservation._id });
    }

    // Update Payment
    if (payment) {
      payment.status = 'PAID';
      payment.paymentMethod = 'CHAPA';
      payment.providerReference = chapaData?.reference || chapaData?.tx_ref || txRef;
      payment.paidAt = new Date();
      payment.metadata = {
        ...(payment.metadata || {}),
        chapa: chapaData
      };
      await payment.save();

      // Recalculate Folio
      if (payment.folio) {
        await FolioService.recalculateFolio(payment.folio);
      }
    }

    // Update Reservation
    if (reservation) {
      reservation.paymentStatus = 'PAID';
      reservation.paymentMethod = 'CHAPA';
      reservation.paymentGatewayReference = chapaData?.reference || txRef;
      if (reservation.pricing) {
        reservation.pricing.paidAmount = reservation.pricing.total;
        reservation.pricing.balance = 0;
      }
      reservation.status = 'CONFIRMED';
      await reservation.save();

      // Send confirmation email asynchronously without blocking HTTP response
      if (reservation.guest && reservation.roomType) {
        setImmediate(() => {
          EmailService.sendBookingConfirmation(reservation, reservation.guest, reservation.roomType)
            .catch(mailErr => console.warn('Failed to send Chapa booking confirmation email:', mailErr));
        });
      }

      // Generate PMS Notification
      await Notification.create({
        title: 'Chapa Payment Verified',
        message: `Payment of ETB ${chapaData?.amount || payment?.amount || reservation.pricing?.total} confirmed via Chapa for Booking #${reservation.bookingNumber}`,
        type: 'NEW_ONLINE_BOOKING',
        referenceId: reservation._id.toString(),
        referenceModel: 'Reservation',
        targetRoles: ['HOTEL_MANAGER', 'RECEPTIONIST']
      });

      // Audit Log
      await AuditLog.create({
        userName: 'Chapa Gateway',
        action: 'PAYMENT_RECEIVED',
        resource: 'Payment',
        resourceId: payment?._id?.toString() || reservation._id.toString(),
        details: `Chapa payment verified successfully for ref ${txRef}. Amount: ETB ${chapaData?.amount || payment?.amount}`,
        ipAddress: 'CHAPA_GATEWAY'
      });
    }

    return {
      verified: true,
      reservation,
      payment,
      message: 'Payment verified and credited successfully.'
    };
  }
}
