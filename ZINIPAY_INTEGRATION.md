# ZiniPay Payment Integration Guide

## Overview
This project integrates ZiniPay payment gateway for course purchases. The integration follows the official API specifications from https://zinipay.com/docs

## Configuration

### Environment Variables
Add this in your environment settings (Vercel, Replit Secrets, etc.):

1. **ZINIPAY_API_KEY** (Required)
   - Your API key from ZiniPay dashboard
   - Get it from: https://zinipay.com/dashboard → API Settings → API Key

## API Endpoints

### 1. Create Payment (`/api/create-payment`)
Creates a payment link and redirects user to ZiniPay payment page.

**Request:**
```json
POST /api/create-payment
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "amount": "100.00",
  "metadata": {
    "userId": "user123",
    "courses": [
      { "id": "course1", "title": "Course Title", "price": 100 }
    ],
    "subtotal": 100,
    "discount": 0,
    "couponCode": ""
  }
}
```

**Response:**
```json
{
  "success": true,
  "payment_url": "https://secure.zinipay.com/payment/abc123xyz456",
  "message": "Payment link created successfully"
}
```

### 2. Verify Payment (`/api/verify-payment`)
Verifies payment status using invoiceId or transaction ID.

**Request:**
```json
POST /api/verify-payment
{
  "invoiceId": "553ca0ac-28c0-41f7-adc0-6243910b1e1b"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "payment": {
    "fullname": "John Doe",
    "email": "john@example.com",
    "amount": "100.00",
    "transaction_id": "OVKPXW165414",
    "invoice_id": "553ca0ac-28c0-41f7-adc0-6243910b1e1b",
    "trx_id": "OVKPXW165414",
    "status": "COMPLETED",
    "metadata": { ... }
  }
}
```

### 3. Payment Webhook (`/api/payment-webhook`)
Automatically called by ZiniPay when payment is completed. Handles course enrollment.

**Webhook Data:**
```json
{
  "transactionId": "OVKPXW165414",
  "invoiceId": "553ca0ac-28c0-41f7-adc0-6243910b1e1b",
  "status": "COMPLETED",
  "amount": "100.00",
  "paymentMethod": "bKash"
}
```

### 4. Process Enrollment (`/api/process-enrollment`)
Manual enrollment processing (fallback if webhook fails).

**Request:**
```json
POST /api/process-enrollment
{
  "invoiceId": "553ca0ac-28c0-41f7-adc0-6243910b1e1b",
  "userId": "user123"
}
```

## Payment Flow

1. **User adds courses to cart** → Goes to checkout
2. **Frontend calls** `/api/create-payment` → Receives payment URL
3. **User redirected to** ZiniPay payment page → Makes payment
4. **After payment:**
   - Success → Redirected to `/payment-success?invoiceId=xxx&transactionId=xxx`
   - Cancel → Redirected to `/payment-cancel`
5. **ZiniPay sends webhook** to `/api/payment-webhook`
6. **Webhook verifies payment** → Enrolls user in courses → Saves payment record

## Key Improvements Over RupantorPay

✅ **Better metadata handling** - Metadata is properly preserved and parsed  
✅ **Dual ID system** - Both invoiceId and transactionId for better tracking  
✅ **Enhanced error handling** - Clear error messages for debugging  
✅ **Automatic metadata parsing** - Handles both string and object formats  
✅ **Improved verification** - More reliable payment verification process

## Security Features

✅ Payment verification before enrollment  
✅ User ID validation  
✅ Idempotent processing (prevents duplicate enrollments)  
✅ Secure API key handling via environment variables  
✅ No API keys exposed in client-side code  
✅ Webhook signature verification (via re-verification with ZiniPay)

## Supported Payment Methods

- bKash
- Nagad
- Rocket
- Other methods supported by ZiniPay

## Testing

### Test Payment Flow:
1. Add a course to cart
2. Go to checkout
3. Click "Proceed to Payment"
4. You'll be redirected to ZiniPay payment page
5. Complete payment
6. You'll be redirected back to success page with invoiceId and transactionId
7. Courses will be automatically enrolled

### Check Logs:
- In Vercel → Your Project → Deployments → Functions → View logs
- In Replit → Check the workflow console logs

## Troubleshooting

### Error: "Payment service key missing"
- Add `ZINIPAY_API_KEY` to environment variables
- Redeploy/restart the project

### Error: "Transaction ID not found" or "invoiceId not found"
- Verify your API key is correct
- Ensure the payment was actually completed
- Check ZiniPay dashboard for transaction status
- Check that both invoiceId and transactionId are being passed in the URL

### Error: "No userId found in payment metadata"
**This was a major issue with RupantorPay - now fixed in ZiniPay integration:**
- Metadata is now properly stringified before sending to ZiniPay
- Metadata is properly parsed when received from ZiniPay
- userId is always included in metadata during payment creation
- Both string and object metadata formats are supported

### Webhook not working
- Ensure your deployment is live and publicly accessible
- Check webhook URL is accessible publicly
- Verify webhook logs in your deployment platform
- Ensure ZiniPay can reach your webhook endpoint

## File Structure

```
api/
├── create-payment.js       # Creates payment link
├── verify-payment.js       # Verifies transaction
├── payment-webhook.js      # Handles payment callbacks
├── process-enrollment.js   # Manual enrollment processing
└── utils/
    └── process-payment.js  # Core enrollment logic
```

## Official Documentation

- API Reference: https://zinipay.com/docs
- Dashboard: https://zinipay.com/dashboard

## Migration from RupantorPay

If you're migrating from RupantorPay:

1. **Update environment variable:**
   - Remove: `RUPANTORPAY_API_KEY`
   - Add: `ZINIPAY_API_KEY` with your ZiniPay API key

2. **Get ZiniPay API Key:**
   - Sign up at https://zinipay.com
   - Go to Dashboard → API Settings
   - Copy your API key

3. **All API endpoints remain the same** - No frontend changes needed!

4. **Key differences:**
   - Better metadata handling (fixes "userId not found" issue)
   - Uses invoiceId as primary identifier (with transactionId as backup)
   - Improved error messages
   - More reliable verification process

## Notes

- All amounts are in BDT (Bangladeshi Taka) by default
- Payment URLs are valid until payment is completed
- Metadata is preserved throughout the payment flow
- Webhook is the primary method for enrollment (most reliable)
- Manual enrollment via `/api/process-enrollment` is available as fallback
