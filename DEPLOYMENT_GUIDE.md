# Deployment Guide - Easy Education

## 🔧 PWA সমস্যা সমাধান

### Vercel এ PWA কেন কাজ করছে না?

1. **Manifest সমস্যা**: আপনার PWA ডাইনামিক manifest ব্যবহার করছে `/api/manifest.json` এন্ডপয়েন্ট থেকে
2. **Service Worker**: Service worker সঠিকভাবে রেজিস্টার হচ্ছে না Vercel এ
3. **Build Configuration**: Vercel এর জন্য সঠিক build config নেই

### সমাধান:

আমি এখন PWA ঠিক করে দিচ্ছি। নিচের পরিবর্তনগুলো করছি:

1. `vercel.json` এ manifest API যোগ করব
2. Static manifest ফাইল তৈরি করব যা সব জায়গায় কাজ করবে
3. Service worker path ঠিক করব

---

## 🌐 Shared Hosting এ Deploy করার Steps

### প্রয়োজনীয় Requirements:

1. **Node.js Support**: Shared hosting এ Node.js সাপোর্ট থাকতে হবে (version 18 বা তার বেশি)
2. **Database**: Firebase ব্যবহার করছেন, তাই ভালো। নিজের ডাটাবেস চালানোর দরকার নেই
3. **Domain**: আপনার ডোমেইন নেম

### Step by Step Process:

#### 1. **Build তৈরি করুন**
```bash
npm run build
```
এটা `dist` ফোল্ডারে সব ফাইল তৈরি করবে।

#### 2. **Server Setup**
- `server.js` ফাইল আপলোড করুন
- `package.json` আপলোড করুন
- `dist` ফোল্ডার আপলোড করুন
- `api` ফোল্ডার আপলোড করুন

#### 3. **Dependencies Install**
Shared hosting এর terminal/SSH তে:
```bash
npm install --production
```

#### 4. **Environment Variables সেটআপ**
`.env` ফাইল তৈরি করুন:
```env
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY=your_key
IMGBB_API_KEY=your_imgbb_key
```

#### 5. **Start Server**
```bash
NODE_ENV=production node server.js
```

#### 6. **Process Manager (Optional but Recommended)**
PM2 ব্যবহার করুন server সবসময় চালু রাখার জন্য:
```bash
npm install -g pm2
pm2 start server.js --name easy-education
pm2 save
pm2 startup
```

### ⚠️ Shared Hosting Limitations:
- অনেক shared hosting Node.js সাপোর্ট করে না
- CPU এবং Memory limit থাকে
- SSL certificate setup করতে হবে (PWA এর জন্য HTTPS দরকার)

### 💡 Better Alternatives:
1. **Vercel** (Free, PWA সাপোর্ট, Auto SSL) ✅ সবচেয়ে ভালো
2. **Netlify** (Free, Good for static sites)
3. **Railway** (Node.js apps এর জন্য ভালো)
4. **Render** (Free tier available)

---

## 📊 Firebase Free Tier Limits

### Firestore Database:
- **Storage**: 1 GB পর্যন্ত ফ্রি
- **Document Reads**: 50,000 per day
- **Document Writes**: 20,000 per day
- **Document Deletes**: 20,000 per day
- **Network Egress**: 10 GB per month

### Firebase Storage (ফাইল স্টোরেজ):
- **Storage**: 5 GB ফ্রি
- **Downloads**: 1 GB per day
- **Uploads**: 1 GB per day

### Firebase Cloud Messaging (Notifications):
- **Unlimited Free**

### আপনার Website এর জন্য Calculation:

#### ধরুন আপনার website এ:
- **100 Users** রেগুলার ভিজিট করে
- প্রতি user দিনে **50 টা document read** করে (কোর্স দেখা, ক্লাস দেখা, etc.)
- প্রতি user দিনে **5 টা document write** করে (enrollment, progress tracking)

#### Daily Usage:
- **Reads**: 100 users × 50 = 5,000 reads/day (Limit: 50,000) ✅ সেফ
- **Writes**: 100 users × 5 = 500 writes/day (Limit: 20,000) ✅ সেফ

#### Storage Calculation:

**প্রতি Course Document**: ~5 KB
- 100 courses = 500 KB

**প্রতি Class/Video Document**: ~3 KB
- 500 classes = 1.5 MB

**প্রতি User Document**: ~2 KB
- 1000 users = 2 MB

**Payments, Announcements, etc**: ~5 MB

**Total**: প্রায় 10 MB (Limit: 1 GB) ✅ অনেক জায়গা আছে

### আপনি কতজন User Handle করতে পারবেন?

**Conservative Estimate:**
- **500-1000 active users** easily handle করতে পারবেন free tier এ
- যদি **video files** Firebase Storage এ রাখেন, তাহলে 5 GB limit এ প্রায় **50-100টা video** রাখতে পারবেন (প্রতি video 50-100 MB হলে)

### 💰 যদি Limit Cross করে?

Firebase এর **Blaze Plan** (Pay as you go):
- শুধু যা ব্যবহার করবেন তার জন্য pay করবেন
- প্রথম free tier এর পরে:
  - Per 100K document reads: $0.06
  - Per 100K document writes: $0.18
  - Storage per GB: $0.18/month

**মাসিক খরচ (500 users এর জন্য):**
- Reads: ~$0.50
- Writes: ~$0.10
- Storage: ~$0.20
- **Total**: প্রায় $1-2 per month

---

## 🎯 Recommendations:

### 1. **Video Storage:**
- ❌ Firebase Storage ব্যবহার করবেন না videos এর জন্য (expensive হবে)
- ✅ **YouTube** বা **Vimeo** এ upload করুন (free এবং better streaming)
- ✅ অথবা **Bunny CDN** / **Cloudflare Stream** use করুন (সস্তা)

### 2. **Image Storage:**
- ✅ আপনি ইতিমধ্যে **imgBB** ব্যবহার করছেন - এটা ভালো
- অথবা **Cloudinary** (free tier: 25 GB storage + 25 GB bandwidth/month)

### 3. **Deployment:**
- ✅ **Vercel** ব্যবহার করুন (Free, Fast, Easy)
- PWA ঠিকমতো কাজ করবে
- Auto SSL
- Global CDN

### 4. **Cost Optimization:**
- Cache করুন যতটা possible (local storage, service worker)
- Minimize database reads - একবার load করে cache এ রাখুন
- Pagination use করুন বড় lists এর জন্য

---

## 📝 Next Steps:

1. PWA fix করছি Vercel এর জন্য
2. Service worker update করছি
3. Manifest configuration ঠিক করছি
4. Testing করব সব ঠিকমতো কাজ করছে কিনা
