/**
 * ZiniPay Payment Verification API
 * Verifies payment status using invoiceId
 * Official Docs: https://zinipay.com/docs
 */

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
      error: "Server configuration error: Payment service key missing." 
    });
  }

  const { transaction_id, invoiceId } = req.body;
  const paymentId = invoiceId || transaction_id;

  if (!paymentId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing invoiceId or transaction_id in request body." 
    });
  }

  try {
    console.log('Verifying payment with invoiceId:', paymentId);
    
    const response = await fetch(VERIFY_API_URL, {
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

    const paymentData = await response.json();
    
    console.log('ZiniPay verification response:', JSON.stringify(paymentData, null, 2));
    console.log('Response status code:', response.status);

    // According to ZiniPay official example:
    // Status is at root level: paymentData.status
    // Data is nested: paymentData.data.*
    
    if (paymentData.status === 'COMPLETED') {
      // Payment is verified successfully
      const data = paymentData.data || {};
      
      // Parse metadata if it's a string
      let metadata = data.metadata || {};
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error('Failed to parse metadata:', e);
        }
      }

      console.log('✅ Payment verified successfully!');
      console.log('Transaction ID:', data.transactionId);
      console.log('Amount:', data.amount);

      return res.status(200).json({
        success: true,
        verified: true,
        payment: {
          fullname: data.customerName,
          email: data.customerEmail,
          amount: data.amount,
          transaction_id: data.transactionId,
          invoice_id: data.invoiceId,
          trx_id: data.transactionId,
          currency: data.currency || 'BDT',
          metadata: metadata,
          payment_method: data.paymentMethod,
          status: paymentData.status
        }
      });
    } else if (paymentData.status === 'PENDING') {
      return res.status(200).json({
        success: true,
        verified: false,
        status: 'PENDING',
        message: "Payment is still pending"
      });
    } else {
      // Verification failed or other status
      console.error('❌ Payment verification failed:', paymentData.message);
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
