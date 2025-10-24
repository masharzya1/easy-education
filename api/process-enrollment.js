import { processPaymentAndEnrollUser } from './utils/process-payment.js';

const RUPANTORPAY_API_KEY = process.env.RUPANTORPAY_API_KEY;
const RUPANTORPAY_DEVICE_KEY = process.env.RUPANTORPAY_DEVICE_KEY;
const VERIFY_API_URL = 'https://payment.rupantorpay.com/api/payment/verify-payment';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  if (!RUPANTORPAY_API_KEY) {
    console.error("RUPANTORPAY_API_KEY is missing!");
    return res.status(500).json({ success: false, error: "Server configuration error" });
  }

  if (!RUPANTORPAY_DEVICE_KEY) {
    console.error("RUPANTORPAY_DEVICE_KEY is missing!");
    return res.status(500).json({ success: false, error: "Server configuration error: Device key missing." });
  }

  const { transaction_id, userId } = req.body;

  if (!transaction_id || !userId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing transaction_id or userId in request body." 
    });
  }

  try {
    const verifyResponse = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': RUPANTORPAY_API_KEY,
        'X-DEVICE-KEY': RUPANTORPAY_DEVICE_KEY,
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

    const payment = verifyData;
    const metadata = payment.metadata || {};
    const courses = metadata.courses || [];
    const metadataUserId = metadata.userId;

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
        verified: true,
        alreadyProcessed: result.alreadyProcessed,
        payment: {
          fullname: payment.fullname,
          email: payment.email,
          amount: payment.amount,
          transaction_id: payment.transaction_id,
          trx_id: payment.trx_id,
          currency: payment.currency,
          metadata: payment.metadata,
          payment_method: payment.payment_method,
          status: payment.status
        },
        paymentRecord: result.paymentRecord
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
