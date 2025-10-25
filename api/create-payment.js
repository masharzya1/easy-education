/**
 * ZiniPay Payment Creation API
 * Official Docs: https://zinipay.com/docs
 */

const ZINIPAY_API_KEY = process.env.ZINIPAY_API_KEY;
const PAYMENT_API_URL = 'https://api.zinipay.com/v1/payment/create';

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

  const { fullname, email, amount, metadata } = req.body;

  if (!fullname || !email || !amount) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: fullname, email, and amount are required." 
    });
  }

  // Get base URL for callbacks
  const host = req.headers.host;
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    // Generate a unique invoice ID for this payment
    const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Prepare payment data according to ZiniPay API specs
    const paymentData = {
      invoiceId: invoiceId,  // CRITICAL: Required for ZiniPay to persist the invoice
      order_id: invoiceId,   // Alternative field name (WordPress plugin uses this)
      amount: parseFloat(amount).toFixed(2),
      cus_name: fullname,
      cus_email: email,
      redirect_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancel`,
      webhook_url: `${baseUrl}/api/payment-webhook`,
      metadata: metadata || {}
    };

    console.log('Creating ZiniPay payment:', { 
      invoiceId,
      fullname, 
      email, 
      amount: paymentData.amount,
      baseUrl,
      metadata: metadata 
    });

    const response = await fetch(PAYMENT_API_URL, {
      method: 'POST',
      headers: {
        'zini-api-key': ZINIPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    console.log('ZiniPay create payment response:', JSON.stringify(data, null, 2));
    console.log('Response status code:', response.status);
    console.log('Generated invoiceId:', invoiceId);
    console.log('Metadata sent:', JSON.stringify(metadata, null, 2));

    // Check for successful response
    if (data.status === true && data.payment_url) {
      console.log('✅ Payment created successfully. InvoiceId:', invoiceId);
      console.log('Payment URL:', data.payment_url);
      
      return res.status(200).json({
        success: true,
        payment_url: data.payment_url,
        invoiceId: invoiceId,  // Return invoiceId for frontend tracking
        message: data.message || "Payment link created successfully"
      });
    } else {
      console.error('❌ ZiniPay error response:', data);
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
