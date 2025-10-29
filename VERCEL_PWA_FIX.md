# Vercel এ PWA ঠিক করার Guide

## ✅ যা করা হয়েছে:

### 1. **vercel.json Update**
- Service worker এর জন্য সঠিক headers যোগ করা হয়েছে
- Manifest API কে function হিসেবে configure করা হয়েছে
- Cache control headers ঠিক করা হয়েছে

### 2. **Service Worker Version Update**
- Cache version v6 এ update করা হয়েছে
- পুরনো cache automatically clear হবে

## 🚀 Vercel এ Deploy করার Steps:

### Step 1: Build করুন (Local এ Test করার জন্য)
```bash
npm run build
npm run start
```

### Step 2: Vercel এ Push করুন

#### Option A: Git থেকে Auto Deploy
1. আপনার code GitHub/GitLab এ push করুন
2. Vercel dashboard এ যান
3. "Import Project" ক্লিক করুন
4. Repository select করুন
5. Deploy ক্লিক করুন

#### Option B: Vercel CLI দিয়ে
```bash
npm install -g vercel
vercel login
vercel
```

### Step 3: Environment Variables সেট করুন

Vercel Dashboard → Settings → Environment Variables:

```
FIREBASE_PROJECT_ID=easy-educat
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
IMGBB_API_KEY=your-imgbb-key
NODE_ENV=production
```

### Step 4: Build Settings Check করুন

Vercel Dashboard → Settings → General:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔍 PWA কাজ করছে কিনা Check করার উপায়:

### Chrome DevTools:
1. F12 চাপুন
2. Application tab এ যান
3. **Manifest** দেখুন - সব info সঠিক আছে কিনা
4. **Service Workers** দেখুন - "activated and is running" দেখাচ্ছে কিনা

### PWA Install করার পর:
1. Mobile এ 3 dots menu → "Add to Home Screen"
2. Desktop এ address bar এ install icon দেখা যাবে
3. Install করার পর app খুললে standalone mode এ খুলবে (browser UI ছাড়া)

## ⚠️ Common Issues এবং Solutions:

### Issue 1: "Add to Home Screen" দেখাচ্ছে না
**Solution:**
- HTTPS check করুন (Vercel auto provide করে)
- Manifest file load হচ্ছে কিনা check করুন: `yoursite.com/api/manifest.json`
- Service worker registered আছে কিনা check করুন

### Issue 2: Service Worker register হচ্ছে না
**Solution:**
- Browser cache clear করুন: DevTools → Application → Clear Storage
- Hard refresh করুন: Ctrl+Shift+R (Windows) বা Cmd+Shift+R (Mac)
- "Update on reload" checkbox enable করুন DevTools → Application → Service Workers

### Issue 3: Icons দেখাচ্ছে না
**Solution:**
- `public` folder এ icon files আছে কিনা check করুন:
  - icon-192x192.png
  - icon-512x512.png
- Icons সঠিক size এ আছে কিনা verify করুন

### Issue 4: PWA install হওয়ার পর white screen
**Solution:**
- `start_url` এবং `scope` manifest এ সঠিক আছে কিনা check করুন
- Service worker fetch events সঠিকভাবে handle করছে কিনা verify করুন

## 📱 PWA Features যা এখন কাজ করবে:

✅ **Offline Support**: Service worker cache করবে static files
✅ **Install to Home Screen**: Mobile ও Desktop দুটোতেই
✅ **Push Notifications**: Firebase Cloud Messaging এর মাধ্যমে
✅ **App Shortcuts**: Courses এবং My Courses shortcuts
✅ **Standalone Mode**: Full screen app experience

## 🎯 Next Steps:

1. ✅ Vercel এ deploy করুন updated code দিয়ে
2. ✅ PWA test করুন mobile এবং desktop এ
3. ✅ Push notification test করুন
4. ✅ Offline functionality test করুন

## 💡 Pro Tips:

### Cache Strategy Optimization:
আপনার app এ video content আছে, তাই:
- ❌ Video files cache করবেন না (too large)
- ✅ শুধু HTML, CSS, JS, এবং small images cache করুন
- ✅ YouTube embedded videos ব্যবহার করুন (better performance)

### Performance Optimization:
```javascript
// Service worker এ selective caching
if (!event.request.url.includes('video') && 
    !event.request.url.includes('firebase')) {
  // Cache করুন
}
```

### Regular Updates:
- Service worker version বাড়ান যখন major changes করবেন
- Users automatically নতুন version পাবে next visit এ

## 🔗 Testing URLs:

After deployment, test these:
- Main site: `https://your-site.vercel.app`
- Manifest: `https://your-site.vercel.app/api/manifest.json`
- Service Worker: `https://your-site.vercel.app/service-worker.js`

## 📞 যদি এখনো Problem হয়:

1. Browser console check করুন errors এর জন্য
2. Vercel deployment logs দেখুন
3. Service worker unregister করে fresh start করুন:
   ```javascript
   // Browser console এ run করুন
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister())
   })
   ```
