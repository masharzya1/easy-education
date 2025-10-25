/**
 * RupantorPay Payment Verification API
 * Verifies payment status using transaction_id
 * Official Docs: https://rupantorpay.readme.io/reference/verify-payment
 * 
 * CRITICAL FIX: Proper metadata parsing to handle both string and object formats
 */

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
    console.log('Verifying payment with transaction_id:', transaction_id);
    
    const response = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': RUPANTORPAY_API_KEY
      },
      body: JSON.stringify({ 
        transaction_id: transaction_id
      })
    });

    const paymentData = await response.json();
    
    console.log('RupantorPay verification response:', JSON.stringify(paymentData, null, 2));
    console.log('Response status code:', response.status);

    if (paymentData.status === 'success' && paymentData.data) {
      const data = paymentData.data;
      
      // CRITICAL FIX: Parse metadata properly - handle both string and object formats
      let metadata = {};
      if (data.metadata) {
        if (typeof data.metadata === 'string') {
          try {
            metadata = JSON.parse(data.metadata);
            console.log('✅ Metadata parsed from string:', metadata);
          } catch (e) {
            console.error('❌ Failed to parse metadata string:', e);
            console.error('Raw metadata value:', data.metadata);
          }
        } else if (typeof data.metadata === 'object') {
          metadata = data.metadata;
          console.log('✅ Metadata is already an object:', metadata);
        }
      }

      console.log('✅ Payment verified successfully!');
      console.log('Transaction ID:', data.transaction_id);
      console.log('Amount:', data.amount);
      console.log('Parsed metadata:', metadata);

      return res.status(200).json({
        success: true,
        verified: true,
        payment: {
          fullname: data.name || metadata.fullname || 'N/A',
          email: data.email || metadata.email || 'N/A',
          amount: data.amount,
          transaction_id: data.transaction_id,
          trx_id: data.transaction_id,
          status: data.status || 'COMPLETED',
          payment_method: data.payment_method || 'N/A',
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
