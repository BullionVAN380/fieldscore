import { Request, Response } from 'express';
import { Payment } from '../models/Payment';
import { Farmer } from '../models/Farmer';
import { mpesaService } from '../services/mpesa';

export const paymentController = {
  async initiatePayment(req: Request, res: Response) {
    try {
      const { farmerId, phoneNumber, amount } = req.body;

      // Validate farmer exists
      const farmer = await Farmer.findById(farmerId);
      if (!farmer) {
        return res.status(404).json({ success: false, message: 'Farmer not found' });
      }

      // Create payment record
      const payment = new Payment({
        farmerId,
        amount,
        phoneNumber,
        status: 'pending'
      });
      await payment.save();

      // Initiate STK Push
      const stkResponse = await mpesaService.initiateSTKPush(phoneNumber, amount);

      if (stkResponse.success) {
        // Update payment record with M-Pesa request IDs
        payment.checkoutRequestId = stkResponse.data?.CheckoutRequestID;
        payment.merchantRequestId = stkResponse.data?.MerchantRequestID;
        await payment.save();

        return res.json({
          success: true,
          message: 'Payment initiated successfully',
          data: {
            paymentId: payment._id,
            checkoutRequestId: payment.checkoutRequestId
          }
        });
      } else {
        payment.status = 'failed';
        payment.resultDesc = stkResponse.message;
        await payment.save();

        return res.status(400).json({
          success: false,
          message: stkResponse.message || 'Failed to initiate payment'
        });
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async handleCallback(req: Request, res: Response) {
    try {
      const { Body: { stkCallback } } = req.body;
      const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

      // Find and update payment record
      const payment = await Payment.findOne({ checkoutRequestId: CheckoutRequestID });
      if (!payment) {
        console.error('Payment not found for checkout request:', CheckoutRequestID);
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      payment.resultCode = ResultCode;
      payment.resultDesc = ResultDesc;
      payment.status = ResultCode === 0 ? 'completed' : 'failed';
      
      if (ResultCode === 0) {
        const { CallbackMetadata: { Item } } = stkCallback;
        const transactionId = Item.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
        if (transactionId) {
          payment.transactionId = transactionId;
        }
      }

      await payment.save();

      return res.json({ success: true });
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      return res.json({
        success: true,
        data: {
          status: payment.status,
          transactionId: payment.transactionId,
          amount: payment.amount,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        }
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};
