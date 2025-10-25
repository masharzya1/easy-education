/**
 * BangoPay BD Payment Verification API
 * Verifies payment status using order_id
 * Official Docs: https://bangopaybd.com/developers
 */

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
      error: "Server configuration error: Payment service key missing." 
    });
  }

  const { order_id, transaction_id } = req.body;
  const paymentId = order_id || transaction_id;

  if (!paymentId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing order_id or transaction_id in request body." 
    });
  }

  try {
    console.log('Verifying payment with order_id:', paymentId);
    
    const response = await fetch(`${VERIFY_API_BASE_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BANGOPAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = await response.json();
    
    console.log('BangoPay verification response:', JSON.stringify(paymentData, null, 2));
    console.log('Response status code:', response.status);

    if (paymentData.status === 'completed') {
      let metadata = {};
      if (paymentData.metadata) {
        try {
          metadata = typeof paymentData.metadata === 'string' 
            ? JSON.parse(paymentData.metadata) 
            : paymentData.metadata;
        } catch (e) {
          console.error('Failed to parse metadata:', e);
        }
      }

      console.log('✅ Payment verified successfully!');
      console.log('Order ID:', paymentData.order_id);
      console.log('Transaction ID:', paymentData.transaction_id);
      console.log('Amount:', paymentData.amount);
      console.log('Payment Method:', paymentData.payment_method);

      return res.status(200).json({
        success: true,
        verified: true,
        payment: {
          fullname: metadata.fullname || paymentData.customer_name || 'N/A',
          email: paymentData.customer_email || metadata.email || 'N/A',
          amount: paymentData.amount,
          transaction_id: paymentData.transaction_id,
          order_id: paymentData.order_id,
          trx_id: paymentData.transaction_id,
          status: paymentData.status,
          payment_method: paymentData.payment_method,
          paid_at: paymentData.paid_at,
          metadata: metadata
        }
      });
    } else if (paymentData.status === 'pending') {
      return res.status(200).json({
        success: true,
        verified: false,
        status: 'pending',
        message: "Payment is still pending"
      });
    } else {
      console.error('❌ Payment verification failed');
      return res.status(400).json({
        success: false,
        verified: false,
        error: paymentData.message || "Payment verification failed"
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
