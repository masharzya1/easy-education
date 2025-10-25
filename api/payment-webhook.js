/**
 * BangoPay BD Payment Webhook Handler
 * Receives payment notifications from BangoPay and processes enrollment
 * Official Docs: https://bangopaybd.com/developers
 */

import { processPaymentAndEnrollUser } from './utils/process-payment.js';

const BANGOPAY_API_KEY = process.env.BANGOPAY_API_KEY;
const VERIFY_API_BASE_URL = 'https://bangopaybd.com/api/payment/verify';

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
    
    console.log('BangoPay webhook received:', {
      event: webhookData.event,
      order_id: webhookData.order_id,
      transaction_id: webhookData.transaction_id,
      status: webhookData.status,
      amount: webhookData.amount
    });

    // Only process completed payments
    if (webhookData.event !== 'payment.success' && webhookData.status !== 'completed') {
      console.log(`Webhook received with status: ${webhookData.status}, not processing`);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but payment not completed" 
      });
    }

    // Verify payment with BangoPay to prevent fraud
    const paymentId = webhookData.order_id || webhookData.transaction_id;
    const verifyResponse = await fetch(`${VERIFY_API_BASE_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BANGOPAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = await verifyResponse.json();

    if (paymentData.status !== 'completed') {
      console.log('Payment verification failed or not completed:', paymentData.status);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but payment not completed" 
      });
    }

    console.log('✅ Webhook - Payment verified successfully!');
    console.log('Order ID:', paymentData.order_id);
    console.log('Transaction ID:', paymentData.transaction_id);
    console.log('Amount:', paymentData.amount);

    // Parse metadata if it's a string
    let metadata = {};
    if (paymentData.metadata) {
      try {
        metadata = typeof paymentData.metadata === 'string' 
          ? JSON.parse(paymentData.metadata) 
          : paymentData.metadata;
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
      userName: metadata.fullname || paymentData.customer_name || 'N/A',
      userEmail: paymentData.customer_email || metadata.email,
      transactionId: paymentData.transaction_id,
      invoiceId: paymentData.order_id,
      trxId: paymentData.transaction_id,
      paymentMethod: paymentData.payment_method,
      courses,
      subtotal: parseFloat(metadata.subtotal || paymentData.amount),
      discount: parseFloat(metadata.discount || 0),
      couponCode: metadata.couponCode || '',
      finalAmount: parseFloat(paymentData.amount),
      currency: paymentData.currency || 'BDT'
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
