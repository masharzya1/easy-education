/**
 * RupantorPay Payment Webhook Handler
 * Receives payment notifications from RupantorPay and processes enrollment
 * Official Docs: https://rupantorpay.readme.io/
 * 
 * CRITICAL FIX: Proper metadata parsing from webhook data
 */

import { processPaymentAndEnrollUser } from './utils/process-payment.js';

const RUPANTORPAY_API_KEY = process.env.RUPANTORPAY_API_KEY;
const VERIFY_API_URL = 'https://payment.rupantorpay.com/api/verify';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: "Method Not Allowed" 
    });
  }

  try {
    const webhookData = req.body;
    
    console.log('RupantorPay webhook received:', {
      transactionId: webhookData.transactionId || webhookData.transaction_id,
      status: webhookData.status,
      amount: webhookData.paymentAmount || webhookData.amount
    });

    // Only process completed payments
    if (webhookData.status !== 'COMPLETED' && webhookData.status !== 'completed' && webhookData.status !== 'success') {
      console.log(`Webhook received with status: ${webhookData.status}, not processing`);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but payment not completed" 
      });
    }

    // Verify payment with RupantorPay to prevent fraud
    const transactionId = webhookData.transactionId || webhookData.transaction_id;
    const verifyResponse = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': RUPANTORPAY_API_KEY
      },
      body: JSON.stringify({ transaction_id: transactionId })
    });

    const paymentData = await verifyResponse.json();

    if (paymentData.status !== 'success' || !paymentData.data) {
      console.log('Payment verification failed or not completed:', paymentData.status);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but payment not completed" 
      });
    }

    const verifyData = paymentData.data;

    console.log('✅ Webhook - Payment verified successfully!');
    console.log('Transaction ID:', verifyData.transaction_id);
    console.log('Amount:', verifyData.amount);

    // CRITICAL FIX: Parse metadata properly - handle both string and object formats
    let metadata = {};
    if (verifyData.metadata) {
      if (typeof verifyData.metadata === 'string') {
        try {
          metadata = JSON.parse(verifyData.metadata);
          console.log('✅ Webhook - Metadata parsed from string');
        } catch (e) {
          console.error('❌ Webhook - Failed to parse metadata:', e);
          console.error('Raw metadata:', verifyData.metadata);
        }
      } else if (typeof verifyData.metadata === 'object') {
        metadata = verifyData.metadata;
        console.log('✅ Webhook - Metadata is already object');
      }
    }

    console.log('Webhook - Parsed metadata:', metadata);

    const courses = metadata.courses || [];
    const userId = metadata.userId;

    if (!userId) {
      console.error('❌ No userId in payment metadata:', metadata);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but no user ID in metadata" 
      });
    }

    // Process payment and enroll user in courses
    const result = await processPaymentAndEnrollUser({
      userId,
      userName: verifyData.name || metadata.fullname || 'N/A',
      userEmail: verifyData.email || metadata.email,
      transactionId: verifyData.transaction_id,
      invoiceId: verifyData.transaction_id,
      trxId: verifyData.transaction_id,
      paymentMethod: verifyData.payment_method || webhookData.paymentMethod || 'N/A',
      courses,
      subtotal: parseFloat(metadata.subtotal || verifyData.amount),
      discount: parseFloat(metadata.discount || 0),
      couponCode: metadata.couponCode || '',
      finalAmount: parseFloat(verifyData.amount),
      currency: 'BDT'
    });

    if (result.success) {
      console.log('Webhook processed successfully:', result.message);
      return res.status(200).json({ 
        success: true, 
        message: result.message,
        alreadyProcessed: result.alreadyProcessed 
      });
    } else {
      console.error('Error processing webhook payment:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process webhook"
    });
  }
}
