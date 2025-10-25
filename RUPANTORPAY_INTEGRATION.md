# Rupantorpay Payment Integration Guide

## Overview
This project integrates Rupantorpay payment gateway for course purchases. The integration follows the official API specifications from https://rupantorpay.readme.io/reference/get_new-endpoint

## ✅ METADATA FIX APPLIED

**Previous Issue:** Metadata was being double-stringified, causing userId and course data to be lost.

**Solution Implemented:**
- ✅ Metadata is now sent as a **JSON object** (not a stringified string)
- ✅ Proper parsing of metadata in webhook and verification responses
- ✅ Handles both string and object metadata formats for compatibility
- ✅ Extensive logging for debugging metadata issues

**Key Changes:**
```javascript
// ❌ OLD (INCORRECT - caused errors)
metadata: JSON.stringify({ userId: "123", courses: [...] })

// ✅ NEW (CORRECT - fixed)
metadata: { userId: "123", courses: [...] }
```

## Configuration

### Environment Variables (Vercel)
Add these in your Vercel project settings → Environment Variables:

1. **RUPANTORPAY_API_KEY** (Required)
   - Your API key from Rupantorpay dashboard
   - Get it from: https://panel.rupantorpay.com/ → Brands → Your Brand → API Key

## API Endpoints

### 1. Create Payment (`/api/create-payment`)
Creates a payment link and redirects user to Rupantorpay payment page.

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
  "payment_url": "https://payment.rupantorpay.com/api/execute/xxx",
  "message": "Payment link created successfully"
}
```

### 2. Verify Payment (`/api/verify-payment`)
Verifies payment status using transaction ID.

**Request:**
```json
POST /api/verify-payment
{
  "transaction_id": "OVKPXW165414"
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
    "trx_id": "ABC123",
    "status": "COMPLETED",
    "metadata": { ... }
  }
}
```

### 3. Payment Webhook (`/api/payment-webhook`)
Automatically called by Rupantorpay when payment is completed. Handles course enrollment.

**Webhook Data:**
```json
{
  "transactionId": "OVKPXW165414",
  "status": "COMPLETED",
  "paymentAmount": "100.00",
  "paymentMethod": "bKash"
}
```

### 4. Process Enrollment (`/api/process-enrollment`)
Manual enrollment processing (fallback if webhook fails).

**Request:**
```json
POST /api/process-enrollment
{
  "transaction_id": "OVKPXW165414",
  "userId": "user123"
}
```

## Payment Flow

1. **User adds courses to cart** → Goes to checkout
2. **Frontend calls** `/api/create-payment` → Receives payment URL
3. **User redirected to** Rupantorpay payment page → Makes payment
4. **After payment:**
   - Success → Redirected to `/payment-success`
   - Cancel → Redirected to `/payment-cancel`
5. **Rupantorpay sends webhook** to `/api/payment-webhook`
6. **Webhook verifies payment** → Enrolls user in courses → Saves payment record

## Security Features

✅ Payment verification before enrollment  
✅ User ID validation  
✅ Idempotent processing (prevents duplicate enrollments)  
✅ Secure API key handling via environment variables  
✅ No API keys exposed in client-side code

## Supported Payment Methods

- bKash
- Nagad
- Rocket
- Credit/Debit Cards
- Other methods supported by Rupantorpay

## Testing

### Test Payment Flow:
1. Add a course to cart on https://easy-education.vercel.app/courses
2. Go to checkout
3. Click "Proceed to Payment"
4. You'll be redirected to Rupantorpay payment page
5. Complete payment using test credentials (if in sandbox mode)
6. You'll be redirected back to success page
7. Courses will be automatically enrolled

### Check Logs:
Go to Vercel → Your Project → Deployments → Functions → View logs

## Troubleshooting

### Error: "Payment service key missing"
- Add `RUPANTORPAY_API_KEY` to Vercel environment variables
- Redeploy the project

### Error: "Transaction ID not found"
- Verify your API key is correct
- Check if you're using the correct environment (test vs live)
- Contact Rupantorpay support to verify account activation

### Error: "No userId found in payment metadata"
**THIS IS NOW FIXED!** Previous versions had metadata handling issues. The current implementation:
- ✅ Sends metadata as a JSON object (not string)
- ✅ Properly parses both string and object metadata formats
- ✅ Includes extensive logging to debug metadata issues
- ✅ Validates metadata structure before enrollment

If you still see this error:
1. Check the console logs for "Parsed metadata:" output
2. Verify metadata was included during payment creation
3. Ensure userId is included in the metadata object

### Webhook not working
- Ensure your Vercel deployment is live
- Check webhook URL is accessible publicly
- Verify webhook logs in Vercel Functions tab

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

- API Reference: https://rupantorpay.readme.io/reference/get_new-endpoint
- Dashboard: https://panel.rupantorpay.com/
- Support: Contact via Rupantorpay dashboard

## Notes

- All amounts are in BDT (Bangladeshi Taka)
- Payment URLs expire after 30 days
- Metadata is preserved throughout the payment flow
- Webhook is the primary method for enrollment (most reliable)
