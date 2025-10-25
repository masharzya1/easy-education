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

    const responseData = await response.json();
    
    console.log('ZiniPay verification response:', JSON.stringify(responseData, null, 2));
    console.log('Response status code:', response.status);

    // Handle error responses (status: false)
    if (responseData.status === false) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: responseData.message || "Payment verification failed"
      });
    }

    // ZiniPay API returns data directly OR nested in 'data' field
    // Handle both formats for compatibility
    let data = responseData;
    if (responseData.status === 'success' && responseData.data) {
      data = responseData.data;
    }
    
    // Check if payment data exists
    if (!data.invoiceId && !data.transactionId) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: responseData.message || "Invalid payment data received"
      });
    }

    // Parse metadata if it's a string
    let metadata = data.metadata || {};
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    // Check if payment is completed
    if (data.status === 'COMPLETED') {
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
        error: `Payment status is ${data.status}`
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
