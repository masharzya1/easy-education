const RUPANTORPAY_API_KEY = process.env.RUPANTORPAY_API_KEY;
const PAYMENT_API_URL = 'https://payment.rupantorpay.com/api/payment/checkout';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  if (!RUPANTORPAY_API_KEY) {
    console.error("RUPANTORPAY_API_KEY is missing!");
    return res.status(500).json({ success: false, error: "Server configuration error: Payment service key missing." });
  }

  const { fullname, email, amount, metadata } = req.body;

  if (!fullname || !email || !amount) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: fullname, email, and amount are required." 
    });
  }

  const host = req.headers.host || 'localhost:5000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    const paymentData = {
      fullname,
      email,
      amount: parseFloat(amount).toString(),
      success_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancel`,
      webhook_url: `${baseUrl}/api/payment-webhook`,
      meta_data: JSON.stringify(metadata || {})
    };

    console.log('Creating payment with data:', { ...paymentData, meta_data: '[metadata]' });

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

    if ((data.status === 1 || data.status === true) && data.payment_url) {
      return res.status(200).json({
        success: true,
        payment_url: data.payment_url,
        message: data.message || "Payment link created successfully"
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.message || data.error || "Failed to create payment link",
        details: data
      });
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process payment request. Please try again.",
      details: error.message
    });
  }
}
