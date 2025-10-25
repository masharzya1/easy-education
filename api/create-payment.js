/**
 * RupantorPay Payment Creation API
 * Official Docs: https://rupantorpay.readme.io/reference/new-endpoint
 * 
 * CRITICAL FIX: Proper metadata handling to prevent double-stringification
 */

const RUPANTORPAY_API_KEY = process.env.RUPANTORPAY_API_KEY;
const PAYMENT_API_URL = 'https://payment.rupantorpay.com/api/create';

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
    // IMPORTANT: Do NOT stringify metadata here - it will be automatically 
    // stringified when the whole paymentData object is converted to JSON
    const paymentData = {
      name: fullname,
      email: email,
      amount: parseFloat(amount).toFixed(2),
      success_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancel`,
      // Send metadata as object, NOT as stringified JSON
      metadata: metadata || {}
    };

    console.log('Creating RupantorPay payment:', { 
      fullname, 
      email, 
      amount: paymentData.amount,
      baseUrl,
      metadata_type: typeof metadata,
      metadata: metadata 
    });

    const response = await fetch(PAYMENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': RUPANTORPAY_API_KEY
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    console.log('RupantorPay create payment response:', JSON.stringify(data, null, 2));
    console.log('Response status code:', response.status);

    if (data.status === 'success' && data.payment_url) {
      console.log('✅ Payment created successfully');
      console.log('Payment URL:', data.payment_url);
      
      return res.status(200).json({
        success: true,
        payment_url: data.payment_url,
        message: "Payment link created successfully"
      });
    } else {
      console.error('❌ RupantorPay error response:', data);
      return res.status(400).json({
        success: false,
        error: data.message || data.error || "Failed to create payment link"
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
