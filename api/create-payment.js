/**
 * RupantorPay Payment Creation API
 * Official Docs: https://rupantorpay.com/developers/docs
 * 
 * CRITICAL FIXES according to official documentation:
 * 1. Correct endpoint: /api/payment/checkout (NOT /api/payment/create)
 * 2. Field name: metadata (NOT meta_data)
 * 3. Metadata should be sent as JSON object (will be auto-stringified)
 */

const RUPANTORPAY_API_KEY = process.env.RUPANTORPAY_API_KEY;
const PAYMENT_API_URL = 'https://payment.rupantorpay.com/api/payment/checkout';

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

  const { fullname, email, amount, metadata } = req.body;

  if (!fullname || !email || !amount) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: fullname, email, and amount are required." 
    });
  }

  const host = req.headers.host;
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    // According to docs: metadata should be JSON object (not stringified)
    const paymentData = {
      fullname: fullname,
      email: email,
      amount: String(parseFloat(amount).toFixed(2)),
      success_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancel`,
      webhook_url: `${baseUrl}/api/payment-webhook`,
      metadata: metadata || {}
    };

    console.log('Creating RupantorPay payment:', { 
      fullname, 
      email, 
      amount: paymentData.amount,
      baseUrl,
      metadata: metadata
    });

    const response = await fetch(PAYMENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': RUPANTORPAY_API_KEY,
        'X-CLIENT': host || 'localhost'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    console.log('RupantorPay create payment response:', JSON.stringify(data, null, 2));
    console.log('Response status code:', response.status);

    // According to docs: success response has status: 1 (number, not string)
    if (data.status === 1 && data.payment_url) {
      console.log('✅ Payment created successfully');
      console.log('Payment URL:', data.payment_url);
      
      return res.status(200).json({
        success: true,
        payment_url: data.payment_url,
        message: data.message || "Payment link created successfully"
      });
    } else {
      console.error('❌ RupantorPay error response:', data);
      return res.status(400).json({
        success: false,
        error: data.message || "Failed to create payment link"
      });
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process payment request. Please try again."
    });
  }
}