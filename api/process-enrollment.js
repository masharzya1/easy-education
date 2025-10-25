/**
 * Manual Payment Enrollment Processing
 * Used when webhook fails or for manual verification
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

  if (!BANGOPAY_API_KEY) {
    console.error("BANGOPAY_API_KEY is missing!");
    return res.status(500).json({ 
      success: false, 
      error: "Server configuration error" 
    });
  }

  const { order_id, transaction_id, userId } = req.body;
  const paymentId = order_id || transaction_id;

  if (!paymentId || !userId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing order_id/transaction_id or userId in request body." 
    });
  }

  try {
    console.log('Processing enrollment for order_id:', paymentId, 'userId:', userId);

    // Verify payment with BangoPay
    const verifyResponse = await fetch(`${VERIFY_API_BASE_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BANGOPAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = await verifyResponse.json();
    console.log('BangoPay verification response:', JSON.stringify(paymentData, null, 2));

    if (paymentData.status !== 'completed') {
      return res.status(400).json({
        success: false,
        verified: false,
        error: paymentData.message || "Payment verification failed"
      });
    }

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
    const metadataUserId = metadata.userId;

    // Validate user ID matches
    if (!metadataUserId) {
      return res.status(400).json({
        success: false,
        error: "No userId found in payment metadata"
      });
    }

    if (metadataUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: "User ID mismatch - this payment belongs to a different user"
      });
    }

    // Process enrollment
    const result = await processPaymentAndEnrollUser({
      userId: metadataUserId,
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
      return res.status(200).json({
        success: true,
        verified: true,
        message: result.message,
        alreadyProcessed: result.alreadyProcessed,
        coursesEnrolled: courses.length,
        payment: {
          transaction_id: paymentData.transaction_id,
          order_id: paymentData.order_id,
          amount: paymentData.amount,
          metadata: metadata
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Error processing enrollment:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process enrollment. Please try again."
    });
  }
}
