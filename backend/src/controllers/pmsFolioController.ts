import { Response } from 'express';
import { Folio, Payment, Reservation, Stay, HotelSettings } from '../models/index.js';
import { AuthenticatedRequest, logAuditAction } from '../middleware/auth.js';
import { FolioService } from '../services/folioService.js';
import { PaymentService } from '../services/paymentService.js';

export const getFolioDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const folio = await Folio.findById(id)
      .populate('guest')
      .populate('room')
      .populate('reservation')
      .populate('payments')
      .populate('items.postedBy', 'name');

    if (!folio) {
      res.status(404).json({ error: 'Folio not found' });
      return;
    }

    res.json({ folio });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addFolioCharge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category, description, quantity = 1, unitPrice } = req.body;

    if (!category || !description || unitPrice === undefined) {
      res.status(400).json({ error: 'category, description, and unitPrice are required.' });
      return;
    }

    const updatedFolio = await FolioService.addCharge(id, {
      category,
      description,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      postedBy: req.user?._id
    });

    await logAuditAction(
      req, 
      'ADD_FOLIO_CHARGE', 
      'Folio', 
      id, 
      `Added charge: ${description} (ETB ${unitPrice * quantity})`
    );

    res.json({ message: 'Charge posted to folio successfully', folio: updatedFolio });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const processPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // folio ID
    const { amount, paymentMethod, notes, providerReference } = req.body;

    const folio = await Folio.findById(id);
    if (!folio) {
      res.status(404).json({ error: 'Folio not found' });
      return;
    }

    const pmtAmount = Number(amount);
    if (isNaN(pmtAmount) || pmtAmount <= 0) {
      res.status(400).json({ error: 'Valid payment amount is required.' });
      return;
    }

    const payment = await PaymentService.initializePayment({
      folioId: folio._id.toString(),
      reservationId: folio.reservation.toString(),
      guestId: folio.guest.toString(),
      amount: pmtAmount,
      paymentMethod,
      notes,
      processedBy: req.user?._id?.toString()
    });

    // Mark confirmed
    await PaymentService.confirmPayment(payment._id.toString(), {
      providerReference: providerReference || `${paymentMethod}-REF-${Date.now()}`
    });

    const refreshedFolio = await Folio.findById(id).populate('payments');

    await logAuditAction(
      req, 
      'RECORD_PAYMENT', 
      'Payment', 
      payment._id.toString(), 
      `Recorded payment of ETB ${pmtAmount} via ${paymentMethod} on Folio #${folio.folioNumber}`
    );

    res.json({ message: 'Payment recorded successfully', payment, folio: refreshedFolio });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const applyDiscount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { discountAmount, reason } = req.body;

    const folio = await Folio.findById(id);
    if (!folio) {
      res.status(404).json({ error: 'Folio not found' });
      return;
    }

    folio.discountTotal = Math.max(0, Number(discountAmount) || 0);
    await folio.save();

    const updatedFolio = await FolioService.recalculateFolio(folio._id);

    await logAuditAction(
      req, 
      'APPLY_DISCOUNT', 
      'Folio', 
      id, 
      `Applied discount of ETB ${discountAmount}. Reason: ${reason}`
    );

    res.json({ message: 'Discount applied successfully', folio: updatedFolio });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // folio ID
    const folio = await Folio.findById(id)
      .populate('guest')
      .populate('room')
      .populate({
        path: 'reservation',
        populate: [{ path: 'roomType' }]
      })
      .populate('payments')
      .populate('stay');

    if (!folio) {
      res.status(404).json({ error: 'Folio not found' });
      return;
    }

    const hotel = await HotelSettings.findOne();

    res.json({
      invoiceNumber: `INV-${folio.folioNumber.replace('FOL-', '')}`,
      invoiceDate: new Date(),
      hotel,
      folio,
      guest: folio.guest,
      reservation: folio.reservation,
      stay: folio.stay,
      room: folio.room,
      items: folio.items,
      payments: folio.payments,
      totals: {
        subtotal: folio.subtotal,
        taxTotal: folio.taxTotal,
        serviceChargeTotal: folio.serviceChargeTotal,
        discountTotal: folio.discountTotal,
        grandTotal: folio.grandTotal,
        paidTotal: folio.paidTotal,
        balance: folio.balance
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
