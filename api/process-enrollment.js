/**
 * Manual Payment Enrollment Processing
 * Used when webhook fails or for manual verification
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

  if (!ZINIPAY_API_KEY) {
    console.error("ZINIPAY_API_KEY is missing!");
    return res.status(500).json({ 
      success: false, 
      error: "Server configuration error" 
    });
  }

  const { transaction_id, invoiceId, userId } = req.body;
  const paymentId = invoiceId || transaction_id;

  if (!paymentId || !userId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing invoiceId/transaction_id or userId in request body." 
    });
  }

  try {
    console.log('Processing enrollment for invoiceId:', paymentId, 'userId:', userId);

    // Verify payment with ZiniPay
    const verifyResponse = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'zini-api-key': ZINIPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invoiceId: paymentId })
    });

    const verifyData = await verifyResponse.json();
    console.log('ZiniPay verification response:', JSON.stringify(verifyData, null, 2));

    if (verifyData.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        verified: false,
        error: verifyData.message || "Payment verification failed"
      });
    }

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
      return res.status(200).json({
        success: true,
        verified: true,
        message: result.message,
        alreadyProcessed: result.alreadyProcessed,
        coursesEnrolled: courses.length,
        payment: {
          transaction_id: verifyData.transactionId,
          invoice_id: verifyData.invoiceId,
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
