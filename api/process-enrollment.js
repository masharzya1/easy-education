/**
 * Manual Payment Enrollment Processing
 * Used when webhook fails or for manual verification
 * Official Docs: https://rupantorpay.readme.io/reference/verify-payment
 * 
 * CRITICAL FIX: Proper metadata parsing to prevent enrollment failures
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

  if (!RUPANTORPAY_API_KEY) {
    console.error("RUPANTORPAY_API_KEY is missing!");
    return res.status(500).json({ 
      success: false, 
      error: "Server configuration error" 
    });
  }

  const { transaction_id, userId } = req.body;

  if (!transaction_id || !userId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing transaction_id or userId in request body." 
    });
  }

  try {
    console.log('Processing enrollment for transaction_id:', transaction_id, 'userId:', userId);

    // Verify payment with RupantorPay
    const verifyResponse = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': RUPANTORPAY_API_KEY
      },
      body: JSON.stringify({ transaction_id })
    });

    const paymentData = await verifyResponse.json();
    console.log('RupantorPay verification response:', JSON.stringify(paymentData, null, 2));

    if (paymentData.status !== 'success' || !paymentData.data) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: paymentData.message || "Payment verification failed"
      });
    }

    const verifyData = paymentData.data;

    // CRITICAL FIX: Parse metadata properly - handle both string and object formats
    let metadata = {};
    if (verifyData.metadata) {
      if (typeof verifyData.metadata === 'string') {
        try {
          metadata = JSON.parse(verifyData.metadata);
          console.log('✅ Metadata parsed from string');
        } catch (e) {
          console.error('❌ Failed to parse metadata:', e);
          console.error('Raw metadata:', verifyData.metadata);
        }
      } else if (typeof verifyData.metadata === 'object') {
        metadata = verifyData.metadata;
        console.log('✅ Metadata is already object');
      }
    }

    console.log('Parsed metadata:', metadata);

    const courses = metadata.courses || [];
    const metadataUserId = metadata.userId;

    // Validate user ID matches
    if (!metadataUserId) {
      return res.status(400).json({
        success: false,
        error: "No userId found in payment metadata. Please ensure metadata was sent during payment creation."
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
      userName: verifyData.name || metadata.fullname || 'N/A',
      userEmail: verifyData.email || metadata.email,
      transactionId: verifyData.transaction_id,
      invoiceId: verifyData.transaction_id,
      trxId: verifyData.transaction_id,
      paymentMethod: verifyData.payment_method || 'N/A',
      courses,
      subtotal: parseFloat(metadata.subtotal || verifyData.amount),
      discount: parseFloat(metadata.discount || 0),
      couponCode: metadata.couponCode || '',
      finalAmount: parseFloat(verifyData.amount),
      currency: 'BDT'
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        verified: true,
        message: result.message,
        alreadyProcessed: result.alreadyProcessed,
        coursesEnrolled: courses.length,
        payment: {
          transaction_id: verifyData.transaction_id,
          amount: verifyData.amount,
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
