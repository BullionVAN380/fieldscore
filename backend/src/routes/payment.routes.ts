import express from 'express';
import { paymentController } from '../controllers/payment.controller';

const router = express.Router();

// Initiate M-Pesa STK Push payment
router.post('/initiate', paymentController.initiatePayment);

// M-Pesa callback URL
router.post('/callback', paymentController.handleCallback);

// Get payment status
router.get('/status/:paymentId', paymentController.getPaymentStatus);

export default router;
