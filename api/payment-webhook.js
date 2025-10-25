/**
 * ZiniPay Payment Webhook Handler
 * Receives payment notifications from ZiniPay and processes enrollment
 * Official Docs: https://zinipay.com/docs
 */

import { processPaymentAndEnrollUser } from './utils/process-payment.js';

const ZINIPAY_API_KEY = process.env.ZINIPAY_API_KEY;
const VERIFY_API_URL = 'https://api.zinipay.com/v1/payment/verify';

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
    
    console.log('ZiniPay webhook received:', {
      transactionId: webhookData.transactionId,
      invoiceId: webhookData.invoiceId,
      status: webhookData.status,
      amount: webhookData.amount
    });

    // Only process completed payments
    if (webhookData.status !== 'COMPLETED') {
      console.log(`Webhook received with status: ${webhookData.status}, not processing`);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but payment not completed" 
      });
    }

    // Verify payment with ZiniPay to prevent fraud
    const paymentId = webhookData.invoiceId || webhookData.transactionId;
    const verifyResponse = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'zini-api-key': ZINIPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        invoiceId: paymentId,
        apiKey: ZINIPAY_API_KEY
      })
    });

    const paymentData = await verifyResponse.json();

    // According to ZiniPay official example, check status at root level
    if (paymentData.status !== 'COMPLETED') {
      console.log('Payment verification failed or not completed:', paymentData.status, paymentData.message);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but payment not completed" 
      });
    }

    // Payment is verified - data is in nested 'data' field
    const verifyData = paymentData.data || {};

    console.log('✅ Webhook - Payment verified successfully!');
    console.log('Transaction ID:', verifyData.transactionId);
    console.log('Amount:', verifyData.amount);

    // Parse metadata if it's a string
    let metadata = verifyData.metadata || {};
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
        metadata = {};
      }
    }

    const courses = metadata.courses || [];
    const userId = metadata.userId;

    if (!userId) {
      console.error('No userId in payment metadata:', metadata);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but no user ID in metadata" 
      });
    }

    // Process payment and enroll user in courses
    const result = await processPaymentAndEnrollUser({
      userId,
      userName: verifyData.customerName,
      userEmail: verifyData.customerEmail,
      transactionId: verifyData.transactionId,
      invoiceId: verifyData.invoiceId,
      trxId: verifyData.transactionId,
      paymentMethod: verifyData.paymentMethod,
      courses,
      subtotal: parseFloat(metadata.subtotal || verifyData.amount),
      discount: parseFloat(metadata.discount || 0),
      couponCode: metadata.couponCode || '',
      finalAmount: parseFloat(verifyData.amount),
      currency: verifyData.currency || 'BDT'
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
