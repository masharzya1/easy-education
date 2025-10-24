/**
 * Rupantorpay Payment Verification API
 * Verifies payment status using transaction ID
 */

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
      error: "Server configuration error: Payment service key missing." 
    });
  }

  const { transaction_id } = req.body;

  if (!transaction_id) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing transaction_id in request body." 
    });
  }

  try {
    const response = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': RUPANTORPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction_id })
    });

    const data = await response.json();

    if (data.status === 'COMPLETED') {
      return res.status(200).json({
        success: true,
        verified: true,
        payment: {
          fullname: data.fullname,
          email: data.email,
          amount: data.amount,
          transaction_id: data.transaction_id,
          trx_id: data.trx_id,
          currency: data.currency,
          metadata: data.metadata,
          payment_method: data.payment_method,
          status: data.status
        }
      });
    } else if (data.status === 'PENDING') {
      return res.status(200).json({
        success: true,
        verified: false,
        status: 'PENDING',
        message: "Payment is still pending"
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        error: data.message || "Payment verification failed"
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to verify payment. Please try again."
    });
  }
}
