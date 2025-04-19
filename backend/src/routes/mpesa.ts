import express, { Request, Response } from 'express';
import { MpesaService } from '../services/mpesa';
import { Payment } from '../models/payment';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/stk-push', async (req: Request, res: Response) => {
  try {
    console.log('----------------------------------------');
    console.log('Received M-Pesa STK push request');
    console.log('Request body:', req.body);

    const { 
      phoneNumber, 
      amount, 
      farmerId, 
      nationalId, 
      name, 
      gender, 
      county, 
      ward, 
      crop, 
      acres, 
      uai 
    } = req.body;

    if (!phoneNumber || !amount) {
      console.log('Validation failed: Missing phone number or amount');
      return res.status(400).json({
        success: false,
        message: 'Phone number and amount are required'
      });
    }

    console.log('Initiating STK push with Daraja API:', { phoneNumber, amount });
    const result = await MpesaService.initiateSTKPush(
      phoneNumber,
      amount
    );

    console.log('Daraja M-Pesa STK push result:', result);

    if (result.success) {
      console.log('STK push successful, checking if farmer exists');
      try {
        let existingFarmerId = farmerId;
        
        // Check if we have a National ID and no farmerId
        if (nationalId && !farmerId) {
          // Try to find farmer by National ID
          const existingFarmer = await mongoose.model('Farmer').findOne({ nationalId });
          
          if (existingFarmer) {
            // Use existing farmer's ID
            existingFarmerId = existingFarmer._id;
            console.log('Found existing farmer with National ID:', nationalId);
          } else if (nationalId && name && phoneNumber) {
            // Create a new farmer record since this National ID doesn't exist
            console.log('Creating new farmer with National ID:', nationalId);
            const newFarmer = await mongoose.model('Farmer').create({
              name,
              nationalId,
              mobileNumber: phoneNumber,
              gender: gender || 'Male', // Default to Male if not provided
              county: county || '',
              ward: ward || '',
              crop: crop || 'Maize',
              acres: acres || 1,
              premium: amount,
              createdAt: new Date()
            });
            
            existingFarmerId = newFarmer._id;
            console.log('Created new farmer with ID:', existingFarmerId);
          }
        }
        
        // Create a pending payment record
        const paymentData = {
          amount,
          phoneNumber,
          checkoutRequestId: result.data?.checkoutRequestId,
          merchantRequestId: result.data?.merchantRequestId,
          status: 'pending'
        } as any; // Type assertion because we'll conditionally add farmerId
        
        // If we have a farmerId (either provided or newly created), use it
        if (existingFarmerId) {
          paymentData.farmerId = existingFarmerId;
        } else {
          // Create a temporary ObjectId for farmerId to satisfy schema requirement
          paymentData.farmerId = new mongoose.Types.ObjectId();
          console.log('Using temporary farmerId:', paymentData.farmerId);
        }
        
        const payment = new Payment(paymentData);
        await payment.save();
        console.log('Payment record created:', payment);
      } catch (paymentError) {
        // Log payment error but don't fail the request as the STK push was successful
        console.error('Failed to create payment record:', paymentError);
      }
    }

    console.log('Sending response:', result);
    res.json(result);
    console.log('----------------------------------------');
  } catch (error) {
    console.error('Error in STK push:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
});

// Route to check the status of a payment
router.get('/status/:checkoutRequestId', async (req: Request, res: Response) => {
  try {
    const { checkoutRequestId } = req.params;
    
    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Checkout request ID is required'
      });
    }
    
    console.log('Checking payment status for:', checkoutRequestId);
    
    // First, check our database to see if we've already processed this payment
    const payment = await Payment.findOne({ checkoutRequestId });
    
    if (payment && payment.status === 'completed') {
      console.log('Payment already completed in our records');
      return res.json({
        success: true,
        data: {
          checkoutRequestId,
          status: payment.status,
          transactionId: payment.transactionId
        },
        message: 'Payment completed successfully'
      });
    }
    
    // If not completed in our database, check with Safaricom
    const result = await MpesaService.checkTransactionStatus(checkoutRequestId);
    console.log('Daraja transaction status check result:', result);
    
    // If the payment is now complete, update our database
    if (result.success && payment) {
      try {
        await Payment.updateOne(
          { _id: payment._id },
          { 
            $set: {
              status: 'completed',
              resultCode: result.data?.responseCode,
              resultDesc: result.data?.responseDescription
            }
          }
        );
        console.log('Payment record updated to completed status');
      } catch (dbError) {
        console.error('Error updating payment record:', dbError);
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
});

router.post('/callback', async (req: Request, res: Response) => {
  try {
    console.log('Received M-Pesa callback:', JSON.stringify(req.body, null, 2));
    
    // Extract the callback data from the request
    const { Body } = req.body;

    if (Body && Body.stkCallback) {
      const { ResultCode, CheckoutRequestID, ResultDesc } = Body.stkCallback;

      // Find the payment by CheckoutRequestID
      const payment = await Payment.findOne({ checkoutRequestId: CheckoutRequestID });

      if (payment) {
        console.log(`Found payment record for CheckoutRequestID ${CheckoutRequestID}`);
        
        // Update payment status based on ResultCode (0 means success)
        const updates: Record<string, any> = {
          status: ResultCode === 0 ? 'completed' : 'failed',
          resultCode: ResultCode,
          resultDesc: ResultDesc
        };

        // Extract transaction details if payment was successful
        if (ResultCode === 0 && Body.stkCallback.CallbackMetadata) {
          const metadata = Body.stkCallback.CallbackMetadata.Item;
          
          // Find the M-Pesa receipt number
          const mpesaReceipt = metadata.find((item: { Name: string; Value: any }) => 
            item.Name === 'MpesaReceiptNumber'
          );
          if (mpesaReceipt) {
            updates.transactionId = mpesaReceipt.Value;
          }
          
          // Find the transaction amount
          const amount = metadata.find((item: { Name: string; Value: any }) => 
            item.Name === 'Amount'
          );
          if (amount) {
            updates.confirmedAmount = amount.Value;
          }
          
          // Find the transaction date
          const transactionDate = metadata.find((item: { Name: string; Value: any }) => 
            item.Name === 'TransactionDate'
          );
          if (transactionDate) {
            updates.transactionDate = transactionDate.Value;
          }
        }

        // Update the payment record
        console.log('Updating payment record with:', updates);
        await Payment.updateOne({ _id: payment._id }, { $set: updates });
        console.log('Payment record updated successfully');
      } else {
        console.log(`No payment record found for CheckoutRequestID ${CheckoutRequestID}`);
      }
    }

    // Always respond with success to the M-Pesa API
    console.log('Sending success response to M-Pesa callback');
    res.json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    // Still send a success response to M-Pesa to prevent retries
    res.json({ ResultCode: 0, ResultDesc: 'Callback processed' });
  }
});

export default router;
