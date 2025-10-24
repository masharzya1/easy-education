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

    return res.status(200).json({ 
      success: true, 
      message: "Webhook received successfully" 
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process webhook"
    });
  }
}
