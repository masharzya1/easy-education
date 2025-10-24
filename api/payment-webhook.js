import { processPaymentAndEnrollUser } from './utils/process-payment.js';

const RUPANTORPAY_API_KEY = process.env.RUPANTORPAY_API_KEY;
const VERIFY_API_URL = 'https://payment.rupantorpay.com/api/payment/verify-payment';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const webhookData = req.body;
    
    console.log('Payment webhook received:', {
      transactionId: webhookData.transactionId,
      status: webhookData.status,
      amount: webhookData.paymentAmount,
      method: webhookData.paymentMethod
    });

    if (webhookData.status !== 'COMPLETED') {
      console.log(`Webhook received with status: ${webhookData.status}, not processing`);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but payment not completed" 
      });
    }

    const verifyResponse = await fetch(VERIFY_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': RUPANTORPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction_id: webhookData.transactionId })
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.status !== 'COMPLETED') {
      console.log('Payment verification failed:', verifyData);
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but verification failed" 
      });
    }

    const payment = verifyData;
    const metadata = payment.metadata || {};
    const courses = metadata.courses || [];
    const userId = metadata.userId;

    if (!userId) {
      console.error('No userId in payment metadata');
      return res.status(200).json({ 
        success: true, 
        message: "Webhook received but no user ID in metadata" 
      });
    }

    const result = await processPaymentAndEnrollUser({
      userId,
      userName: payment.fullname,
      userEmail: payment.email,
      transactionId: payment.transaction_id,
      trxId: payment.trx_id,
      paymentMethod: payment.payment_method,
      courses,
      subtotal: parseFloat(metadata.subtotal || payment.amount),
      discount: parseFloat(metadata.discount || 0),
      couponCode: metadata.couponCode || '',
      finalAmount: parseFloat(payment.amount),
      currency: payment.currency || 'BDT'
    });

    if (result.success) {
      console.log('Webhook processed successfully:', result.message);
      return res.status(200).json({ 
        success: true, 
        message: result.message,
        alreadyProcessed: result.alreadyProcessed 
      });
    } else {
      console.error('Error processing webhook payment:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process webhook"
    });
  }
}
