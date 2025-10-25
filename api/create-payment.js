/**
 * BangoPay BD Payment Creation API
 * Official Docs: https://bangopaybd.com/developers
 */

const BANGOPAY_API_KEY = process.env.BANGOPAY_API_KEY;
const PAYMENT_API_URL = 'https://bangopaybd.com/api/payment/create';

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
    const paymentData = {
      amount: parseFloat(amount),
      currency: "BDT",
      description: `Course purchase by ${fullname}`,
      success_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancel`,
      fail_url: `${baseUrl}/payment-cancel`,
      customer_email: email,
      customer_phone: metadata?.phone || "",
      metadata: JSON.stringify(metadata || {})
    };

    console.log('Creating BangoPay payment:', { 
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
        'Authorization': `Bearer ${BANGOPAY_API_KEY}`
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    console.log('BangoPay create payment response:', JSON.stringify(data, null, 2));
    console.log('Response status code:', response.status);

    if (data.status === 'success' && data.payment_url) {
      console.log('✅ Payment created successfully');
      console.log('Payment URL:', data.payment_url);
      console.log('Order ID:', data.order_id);
      
      return res.status(200).json({
        success: true,
        payment_url: data.payment_url,
        order_id: data.order_id,
        message: "Payment link created successfully"
      });
    } else {
      console.error('❌ BangoPay error response:', data);
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
