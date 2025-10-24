/**
 * Manual Payment Enrollment Processing
 * Used when webhook fails or for manual verification
 */

import { processPaymentAndEnrollUser } from './utils/process-payment.js';

const RUPANTORPAY_API_KEY = process.env.RUPANTORPAY_API_KEY;
const VERIFY_API_URL = 'https://payment.rupantorpay.com/api/payment/verify-payment';

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
    // Verify payment with Rupantorpay
    const verifyResponse = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': RUPANTORPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction_id })
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        verified: false,
        error: verifyData.message || "Payment verification failed"
      });
    }

    // Extract payment data
    const payment = verifyData;
    const metadata = payment.metadata || {};
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
      userName: payment.fullname,
      userEmail: payment.email,
      transactionId: payment.transaction_id,
      trxId: payment.trx_id,
      paymentMethod: payment.payment_method,
      courses,
      subtotal: parseFloat(metadata.subtotal || payment.amount),
      discount: parseFloat(metadata.discount || 0),
      couponCode: metadata.couponCode || '',
      finalAmount: parseFloat(payment.amount),
      currency: payment.currency || 'BDT'
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        alreadyProcessed: result.alreadyProcessed,
        coursesEnrolled: courses.length
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
