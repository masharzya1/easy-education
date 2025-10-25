# Google Sheets Integration - Automatic Student Purchase Data Export

এই documentation তে দেখানো হয়েছে কিভাবে student purchase information automatically Google Sheets এ save করবেন।

## Method 1: Replit Integration (Recommended - সবচেয়ে সহজ)

### Setup Steps:

1. **Integration Connect করুন:**
   - Replit এর left sidebar এ যান
   - "Tools" → "Integrations" এ click করুন
   - "Google Sheets" search করুন
   - "Connect" button এ click করুন

2. **Google Account Authorize করুন:**
   - আপনার Google account দিয়ে login করুন
   - Replit কে Google Sheets access দিতে permission দিন
   - Which spreadsheet ব্যবহার করবেন সেটা select করুন অথবা নতুন একটা create করুন

3. **Setup Complete!**
   - Integration automatically configure হয়ে যাবে
   - আপনার Replit project এখন Google Sheets এ data save করতে পারবে

### Integration এর সুবিধা:
✅ API key manually manage করার দরকার নেই
✅ Automatic token refresh
✅ Secure authentication
✅ Easy setup - মাত্র কয়েক click এ

---

## Method 2: Manual Setup with Google Cloud (Advanced)

যদি আপনি manual setup করতে চান, তাহলে নিচের steps follow করুন:

### Step 1: Google Cloud Project Setup

1. **Google Cloud Console এ যান:**
   - https://console.cloud.google.com/ এ যান
   - নতুন project তৈরি করুন (যেমন: "Easy Education Sheets")

2. **Google Sheets API Enable করুন:**
   - Navigation menu → "APIs & Services" → "Library"
   - "Google Sheets API" search করুন
   - "Enable" button এ click করুন

3. **OAuth Consent Screen Configure করুন:**
   - "APIs & Services" → "OAuth consent screen"
   - User Type: "External" select করুন
   - App name: "Easy Education"
   - Support email: আপনার email
   - Scopes: "https://www.googleapis.com/auth/spreadsheets" add করুন

4. **OAuth Client ID Create করুন:**
   - "APIs & Services" → "Credentials"
   - "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `https://your-repl-url.repl.co/api/google-callback`
   - "Create" click করুন
   - **Client ID** এবং **Client Secret** save করে রাখুন

### Step 2: Replit Secrets Setup

Replit এ secrets add করুন:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

### Step 3: Install Required Packages

```bash
npm install googleapis
```

### Step 4: Backend Code Example

একটা নতুন file তৈরি করুন: `api/google-sheets.js`

```javascript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.REPLIT_DEV_DOMAIN}/api/google-callback`
);

// Set credentials if you have refresh token
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

export async function addStudentPurchase(studentData) {
  try {
    const values = [[
      studentData.userName,
      studentData.userEmail,
      studentData.courseNames.join(', '),
      studentData.amount,
      studentData.paymentMethod,
      new Date(studentData.purchasedAt).toLocaleString('bn-BD'),
      studentData.transactionId
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    console.log('Student data added to Google Sheets successfully');
    return { success: true };
  } catch (error) {
    console.error('Error adding to Google Sheets:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const result = await addStudentPurchase(req.body);
    res.json(result);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```

### Step 5: Integration with Payment Processing

আপনার payment processing code এ (যেমন: `api/utils/process-payment.js`) Google Sheets save করার code add করুন:

```javascript
// Import the Google Sheets function
import { addStudentPurchase } from '../google-sheets.js';

// After successful payment processing
if (enrollmentSuccess) {
  // Save to Google Sheets
  await addStudentPurchase({
    userName: userName,
    userEmail: userEmail,
    courseNames: courses.map(c => c.title),
    amount: finalAmount,
    paymentMethod: paymentMethod || 'Online',
    purchasedAt: Date.now(),
    transactionId: transactionId
  });
}
```

### Step 6: Google Spreadsheet Setup

1. **নতুন Google Sheet তৈরি করুন:**
   - https://sheets.google.com/ এ যান
   - নতুন spreadsheet তৈরি করুন
   - Name: "Easy Education Student Purchases"

2. **Header Row Add করুন (First row):**
   - A1: Student Name
   - B1: Email
   - C1: Courses
   - D1: Amount (৳)
   - E1: Payment Method
   - F1: Purchase Date
   - G1: Transaction ID

3. **Spreadsheet ID Copy করুন:**
   - URL থেকে Spreadsheet ID copy করুন
   - Example: `https://docs.google.com/spreadsheets/d/`**`1AbC2DeF3GhI4JkL5MnO`**`/edit`
   - **Bold** part টা হচ্ছে Spreadsheet ID
   - এটা Replit Secrets এ `GOOGLE_SPREADSHEET_ID` হিসেবে add করুন

---

## Data Format যা Google Sheets এ Save হবে:

| Student Name | Email | Courses | Amount (৳) | Payment Method | Purchase Date | Transaction ID |
|--------------|-------|---------|------------|----------------|---------------|----------------|
| আহমেদ আলী | ahmed@example.com | HSC Physics 2025 | 5000 | bKash | ১০/২৫/২০২৫, ৩:৩০ PM | TXN123456 |
| ফাতিমা খান | fatima@example.com | SSC Math, SSC English | 3500 | Nagad | ১০/২৫/২০২৫, ৪:১৫ PM | TXN123457 |

---

## Security Best Practices:

1. **Never commit credentials to git:**
   - সব sensitive information শুধুমাত্র Replit Secrets এ রাখুন
   - `.gitignore` এ নিশ্চিত করুন `.env` file add করা আছে

2. **Use OAuth2 instead of API keys:**
   - OAuth2 বেশি secure
   - Automatic token refresh support করে

3. **Restrict API permissions:**
   - শুধুমাত্র necessary scopes দিন
   - Read/Write permissions carefully manage করুন

---

## Troubleshooting:

### Problem: "Invalid credentials" error
**Solution:** 
- Google Cloud Console এ গিয়ে credentials verify করুন
- Replit Secrets সঠিকভাবে set করা আছে কিনা check করুন

### Problem: "Spreadsheet not found" error
**Solution:**
- Spreadsheet ID সঠিক আছে কিনা verify করুন
- Spreadsheet share settings check করুন (publicly accessible বা specific email দিয়ে shared)

### Problem: Data save হচ্ছে না
**Solution:**
- Sheet name সঠিক আছে কিনা check করুন (default: "Sheet1")
- Google Sheets API quota limit exceed হয়নি তো check করুন

---

## আরও তথ্যের জন্য:

- Google Sheets API Documentation: https://developers.google.com/sheets/api
- Replit Integrations Guide: https://docs.replit.com/
- OAuth 2.0 Setup: https://developers.google.com/identity/protocols/oauth2

---

**Note:** Method 1 (Replit Integration) ব্যবহার করা recommended কারণ এটা সহজ এবং secure। Manual setup শুধুমাত্র তখনই করুন যখন আপনার specific requirements আছে।
