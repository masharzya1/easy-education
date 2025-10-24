// Simple test payment endpoint - no complex metadata
const RUPANTORPAY_API_KEY = process.env.RUPANTORPAY_API_KEY;
const PAYMENT_API_URL = 'https://payment.rupantorpay.com/api/payment/checkout';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  if (!RUPANTORPAY_API_KEY) {
    return res.status(500).json({ success: false, error: "API key missing" });
  }

  const host = req.headers.host || 'easy-education.vercel.app';
  const protocol = 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    // Simple payment with minimal data
    const paymentData = {
      fullname: "Test User",
      email: "test@example.com",
      amount: "10",
      success_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancel`,
      webhook_url: `${baseUrl}/api/payment-webhook`,
      meta_data: { test: "simple" }
    };

    console.log('Test payment request:', paymentData);

    const response = await fetch(PAYMENT_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': RUPANTORPAY_API_KEY,
        'Content-Type': 'application/json',
        'X-CLIENT': host
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    console.log('Rupantorpay response:', data);

    return res.status(200).json({
      request: paymentData,
      response: data
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
