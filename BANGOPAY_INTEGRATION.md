# BangoPay BD Payment Integration Guide

## Overview
This project integrates BangoPay BD payment gateway for course purchases. BangoPay BD is a modern payment automation platform for Bangladesh that supports bKash, Nagad, Rocket, and Upay **without requiring a merchant account**.

**Official Website:** https://bangopaybd.com/

## Key Features

✅ **No Merchant Account Required** - Use personal bKash, Nagad, Rocket accounts  
✅ **Automated Payment Verification** - Real-time API verification  
✅ **Multiple Payment Methods** - bKash, Nagad, Rocket, Upay, Bank Transfer  
✅ **Developer-Friendly** - Clean REST API with comprehensive documentation  
✅ **Zero Transaction Fees** - Subscription-based pricing model  
✅ **Government Approved** - Officially registered in Bangladesh  

## Configuration

### Environment Variables
Add this to your environment settings (Replit Secrets, Vercel, etc.):

**BANGOPAY_API_KEY** (Required)
- Your API key from BangoPay dashboard
- Get it from: https://bangopaybd.com/ → Sign up → Dashboard → API Settings

## API Endpoints

### 1. Create Payment (`/api/create-payment`)
Creates a payment link and redirects user to BangoPay payment page.

**Request:**
```json
POST /api/create-payment
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "amount": "100",
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

**What gets sent to BangoPay:**
```json
{
  "amount": 100,
  "currency": "BDT",
  "description": "Course purchase by John Doe",
  "success_url": "https://yourdomain.com/payment-success",
  "cancel_url": "https://yourdomain.com/payment-cancel",
  "fail_url": "https://yourdomain.com/payment-cancel",
  "customer_email": "john@example.com",
  "customer_phone": "",
  "metadata": "{...}"
}
```

**Response:**
```json
{
  "success": true,
  "payment_url": "https://bangopaybd.com/pay/BP123456789",
  "order_id": "BP123456789",
  "message": "Payment link created successfully"
}
```

### 2. Verify Payment (`/api/verify-payment`)
Verifies payment status using order_id.

**Request:**
```json
POST /api/verify-payment
{
  "order_id": "BP123456789"
}
```

**BangoPay API Response:**
```json
{
  "status": "completed",
  "order_id": "BP123456789",
  "transaction_id": "TXN987654321",
  "amount": 100,
  "currency": "BDT",
  "payment_method": "bKash",
  "customer_email": "john@example.com",
  "customer_phone": "+8801712345678",
  "paid_at": "2025-10-25T10:30:00Z",
  "metadata": {...}
}
```

**Our API Response:**
```json
{
  "success": true,
  "verified": true,
  "payment": {
    "fullname": "John Doe",
    "email": "john@example.com",
    "amount": 100,
    "transaction_id": "TXN987654321",
    "order_id": "BP123456789",
    "trx_id": "TXN987654321",
    "status": "completed",
    "payment_method": "bKash",
    "paid_at": "2025-10-25T10:30:00Z",
    "metadata": {...}
  }
}
```

### 3. Payment Webhook (`/api/payment-webhook`)
Automatically called by BangoPay when payment is completed. Handles course enrollment.

**Webhook Data:**
```json
{
  "event": "payment.success",
  "order_id": "BP123456789",
  "transaction_id": "TXN987654321",
  "status": "completed",
  "amount": 100,
  "currency": "BDT",
  "payment_method": "bKash",
  "customer_phone": "+8801712345678"
}
```

### 4. Process Enrollment (`/api/process-enrollment`)
Manual enrollment processing (fallback if webhook fails).

**Request:**
```json
POST /api/process-enrollment
{
  "order_id": "BP123456789",
  "userId": "user123"
}
```

## Payment Flow

1. **User adds courses to cart** → Goes to checkout
2. **Frontend calls** `/api/create-payment` → Receives payment URL and order_id
3. **User redirected to** BangoPay payment page → Selects payment method (bKash/Nagad/Rocket)
4. **After payment:**
   - Success → Redirected to `/payment-success?order_id=xxx&transaction_id=xxx`
   - Cancel/Fail → Redirected to `/payment-cancel`
5. **BangoPay sends webhook** to `/api/payment-webhook`
6. **Webhook verifies payment** → Enrolls user in courses → Saves payment record

## Security Features

✅ Server-side payment verification before enrollment  
✅ User ID validation  
✅ Idempotent processing (prevents duplicate enrollments)  
✅ Secure API key handling via environment variables  
✅ No API keys exposed in client-side code  
✅ Webhook verification (re-verification with BangoPay)

## Supported Payment Methods

- **bKash** - Personal & Merchant accounts
- **Nagad** - Digital wallet
- **Rocket** - DBBL mobile banking
- **Upay** - Mobile financial service
- **Bank Transfer** - Direct bank deposits

## Getting Started

### Step 1: Sign Up
1. Visit https://bangopaybd.com/
2. Click "Start For Free"
3. Complete registration

### Step 2: Get API Credentials
1. Login to your BangoPay dashboard
2. Navigate to API Settings
3. Generate or copy your API key

### Step 3: Choose a Plan
- **7 Days Trial**: ৳30 (100 transactions limit)
- **15 Days**: ৳40 (Unlimited transactions)
- **1 Month (1 Site)**: ৳60/month (Unlimited)
- **1 Year (1 Site)**: ৳350/year (Best value)

### Step 4: Add API Key
Add your `BANGOPAY_API_KEY` to your environment variables:
- **Replit**: Secrets tab → Add secret
- **Vercel**: Project Settings → Environment Variables

### Step 5: Test Integration
1. Add a course to cart
2. Go to checkout
3. Click "Proceed to Payment"
4. Complete payment on BangoPay page
5. Verify automatic enrollment

## Testing

### Sandbox Environment
BangoPay provides a demo sandbox for testing:
https://pay.bangopaybd.com/api/execute/7fbcd21d3c8d04dc50939b2a55d8b4d2

### Test Payment Flow:
1. Add courses to cart
2. Checkout and get redirected to BangoPay
3. Select payment method
4. Complete test payment
5. Verify redirect back to success page
6. Check automatic enrollment

### Check Logs:
- In Replit → Workflow console logs
- In Vercel → Deployments → Functions → View logs

## Troubleshooting

### Error: "Payment service key missing"
**Solution:**
- Add `BANGOPAY_API_KEY` to environment variables
- Restart/redeploy the project

### Error: "order_id not found"
**Solution:**
- Verify your API key is correct
- Ensure the payment was actually completed
- Check BangoPay dashboard for transaction status

### Webhook not working
**Solution:**
- Ensure your deployment is live and publicly accessible
- Check webhook URL is reachable
- Verify webhook logs in your deployment platform
- Ensure BangoPay can reach your webhook endpoint

### Payment succeeds but no enrollment
**Solution:**
- Check that webhook is properly configured
- Verify metadata contains userId
- Use manual enrollment via `/api/process-enrollment`

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

## Advantages Over Other Gateways

### vs ZiniPay/RupantorPay
✅ More reliable transaction verification  
✅ Better error handling and documentation  
✅ No transaction ID verification issues  
✅ Automated webhook system  

### vs SSLCommerz
✅ No merchant account required  
✅ No transaction fees (subscription-based)  
✅ Simpler integration  
✅ Personal account support  

### vs bKash Direct
✅ Supports multiple payment methods  
✅ Unified API for all MFS  
✅ Automated reconciliation  
✅ No complex merchant approval process  

## Pricing

- **Zero Setup Fees**
- **Zero Transaction Fees**
- **Subscription-based** pricing
- **Unlimited transactions** (except trial)

Example: ৳350/year for 1 website with unlimited transactions

## Official Resources

- **Website:** https://bangopaybd.com/
- **API Documentation:** Available in dashboard after signup
- **Support:** 24/7 customer support via LiveChat
- **Status:** Government-approved and SSL secured

## Migration from ZiniPay/RupantorPay

If migrating from other gateways:

1. **Update environment variable:**
   - Remove: `ZINIPAY_API_KEY` or `RUPANTORPAY_API_KEY`
   - Add: `BANGOPAY_API_KEY`

2. **No frontend changes needed!** All API endpoints remain the same

3. **Key improvements:**
   - Better payment verification (no transaction ID errors)
   - More reliable webhook delivery
   - Cleaner API responses
   - Better metadata handling

## Notes

- All amounts are in BDT (Bangladeshi Taka)
- Payment URLs are valid until payment is completed
- Metadata is preserved throughout the payment flow
- Webhook is the primary method for enrollment (most reliable)
- Manual enrollment via `/api/process-enrollment` is available as fallback
- Uses `order_id` as primary identifier with `transaction_id` as secondary

## Contact & Support

For BangoPay support:
- **Website:** https://bangopaybd.com/
- **LiveChat:** Available on website
- **Email:** Contact through dashboard

For technical integration issues:
- Check console logs for detailed error messages
- Verify API key is correct and active
- Test in sandbox environment first
