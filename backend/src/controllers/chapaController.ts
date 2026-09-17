import { Request, Response } from 'express';
import { ChapaService } from '../services/chapaService.js';
import { Reservation, Folio, Payment } from '../models/index.js';

export const initializeChapaPayment = async (req: Request, res: Response) => {
  try {
    const { reservationId, folioId, amount, email, firstName, lastName, phone, returnUrl } = req.body;

    let resItem: any = null;
    if (reservationId) {
      resItem = await Reservation.findById(reservationId).populate('guest roomType');
    }

    const payAmount = Number(amount || resItem?.pricing?.total || 0);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    const incomingOrigin = req.body.clientUrl || req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
    let clientUrl: string;
    if (incomingOrigin && !incomingOrigin.includes('localhost')) {
      clientUrl = incomingOrigin;
    } else if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
      clientUrl = process.env.CLIENT_URL;
    } else if (process.env.NODE_ENV === 'production') {
      clientUrl = 'https://grand-view-hotel.onrender.com';
    } else {
      clientUrl = incomingOrigin || process.env.CLIENT_URL || 'http://localhost:5173';
    }

    let serverUrl = process.env.SERVER_URL;
    if (!serverUrl || serverUrl.includes('localhost')) {
      if (process.env.NODE_ENV === 'production') {
        serverUrl = 'https://grand-view-hotel-backend.onrender.com';
      } else {
        serverUrl = serverUrl || `http://localhost:${process.env.PORT || 5000}`;
      }
    }

    const txRef = `tx-gvh-${resItem ? resItem.bookingNumber.toLowerCase() : Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const guestEmail = email || resItem?.guest?.email || 'guest@grandviewhotel.com';
    const gFirstName = firstName || resItem?.guest?.firstName || resItem?.guest?.fullName?.split(' ')[0] || 'Guest';
    const gLastName = lastName || resItem?.guest?.lastName || resItem?.guest?.fullName?.split(' ').slice(1).join(' ') || 'Customer';
    const gPhone = phone || resItem?.guest?.phone || undefined;

    const session = await ChapaService.initializeTransaction({
      amount: payAmount,
      currency: 'ETB',
      email: guestEmail,
      firstName: gFirstName,
      lastName: gLastName,
      phone: gPhone,
      txRef,
      callbackUrl: `${serverUrl}/api/public/chapa/callback/${txRef}`,
      returnUrl: returnUrl || (resItem ? `${clientUrl}/booking/confirmation/${resItem.bookingNumber}?chapa_status=success&tx_ref=${txRef}` : `${clientUrl}/?chapa_status=success`),
      title: 'Grand View',
      description: resItem ? `Booking #${resItem.bookingNumber}` : 'Hotel Settlement',
      metadata: {
        reservationId: resItem?._id?.toString(),
        folioId: folioId || undefined
      }
    });

    // Record pending Payment in database with guaranteed valid Folio
    if (resItem) {
      let targetFolio = folioId
        ? await Folio.findById(folioId)
        : await Folio.findOne({ reservation: resItem._id });

      if (!targetFolio) {
        targetFolio = await Folio.create({
          folioNumber: `FOL-${resItem.bookingNumber}`,
          reservation: resItem._id,
          guest: resItem.guest?._id || resItem.guest,
          grandTotal: payAmount,
          balance: payAmount,
          status: 'OPEN'
        });
      }

      await Payment.create({
        transactionId: txRef,
        folio: targetFolio._id,
        reservation: resItem._id,
        guest: resItem.guest?._id || resItem.guest,
        amount: payAmount,
        currency: 'ETB',
        paymentMethod: 'CHAPA',
        status: 'PENDING',
        providerReference: txRef,
        notes: `Chapa hosted checkout initiated: ${txRef}`
      });

      resItem.paymentGatewayReference = txRef;
      await resItem.save();
    }

    res.status(200).json({
      success: true,
      checkoutUrl: session.checkoutUrl,
      txRef: session.txRef
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to initialize Chapa payment session.' });
  }
};

export const verifyChapaPayment = async (req: Request, res: Response) => {
  try {
    const { txRef } = req.params;
    if (!txRef) {
      return res.status(400).json({ error: 'Transaction reference is required.' });
    }

    const result = await ChapaService.verifyAndConfirmPayment(txRef);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to verify payment with Chapa.' });
  }
};

export const chapaCallback = async (req: Request, res: Response) => {
  try {
    const { txRef } = req.params;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (txRef) {
      const result = await ChapaService.verifyAndConfirmPayment(txRef);
      if (result.reservation?.bookingNumber) {
        return res.redirect(`${clientUrl}/booking/confirmation/${result.reservation.bookingNumber}?chapa_verified=true&tx_ref=${txRef}`);
      }
    }

    res.redirect(`${clientUrl}/?chapa_verified=true`);
  } catch (error: any) {
    console.error('Chapa callback handling error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/?chapa_error=verification_failed`);
  }
};

export const chapaWebhook = async (req: Request, res: Response) => {
  try {
    const txRef = req.body?.tx_ref || req.body?.trx_ref || req.query?.tx_ref;
    if (txRef) {
      await ChapaService.verifyAndConfirmPayment(String(txRef));
    }
    res.status(200).json({ status: 'success' });
  } catch (error: any) {
    console.error('Chapa webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};
