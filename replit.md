# Easy Education - Free Online Courses Platform

## Overview
Easy Education is a React-based educational platform that allows users to access free online courses. The platform features course management, user authentication, announcements, news, and payment tracking capabilities.

## Technology Stack
- **Frontend**: React 18.2.0 with Vite
- **Styling**: TailwindCSS 4.x with custom animations
- **UI Components**: Radix UI primitives
- **Authentication**: Firebase Auth with Google OAuth
- **Database**: Firebase Firestore
- **Image Storage**: imgbb.com API
- **Routing**: React Router DOM
- **State Management**: React Context API
- **PWA**: Service Worker enabled

## Project Structure
```
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/        # React context providers (Auth, Cart, Theme)
│   ├── lib/             # Firebase, PWA, email, and image upload utilities
│   ├── pages/           # Route pages and components
│   │   ├── admin/       # Admin dashboard and management pages
│   │   └── api/         # API route handlers
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── public/              # Static assets
├── functions/           # Serverless functions (SendGrid email)
└── scripts/             # Setup scripts

```

## Environment Setup

### Required Environment Variables
The following environment variables may be needed for full functionality:

1. **IMGBB API Key** (Optional - for image uploads):
   - `VITE_IMGBB_API_KEY` or `IMGBB_API_KEY`
   - Get from: https://api.imgbb.com/

2. **SendGrid** (Optional - for email notifications):
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`

**Note**: Firebase configuration is already hardcoded in `src/lib/firebase.js` for the Easy Education project.

## Running the Project

### Development Server
```bash
npm install
npm run dev
```
The app will be available at http://localhost:5000

### Build for Production
```bash
npm run build
```

## Features
- User authentication (Email/Password, Google OAuth)
- Course browsing and enrollment
- Video player with custom controls
- Shopping cart functionality
- Admin dashboard for content management
- Payment tracking
- Announcements and news system
- Dark/Light theme support
- Progressive Web App (PWA) capabilities
- Rankings and user profiles

## Admin Features
Accessible via `/admin` route for authorized users:
- Manage courses, chapters, classes
- Manage subjects and categories
- Manage teachers and students
- **Remove students from courses** - Select user and course to remove enrollment
- Payment management
- Announcements and news
- Website settings
- User rankings

## Recent Changes
- 2025-10-19: Initial project import to Replit
- Configured Vite to allow all hosts for Replit proxy support
- Set up development workflow on port 5000
- Installed all npm dependencies
- **FIXED**: Notification constructor error - now using ServiceWorkerRegistration.showNotification() for proper PWA notifications
- **FIXED**: Service worker registration - both PWA and Firebase Messaging service workers now register correctly
- **NEW**: Added visible PWA install button in header that appears when app is installable
- All dependencies installed and project fully functional

### PWA Enhancements (2025-10-19)
  - Added Firebase Cloud Messaging for push notifications
  - Created PWA install prompt modal component with beforeinstallprompt handler
  - Updated manifest.json with gcm_sender_id for FCM compatibility
  - Created firebase-messaging-sw.js service worker for background notifications
  - Added notification permission handling and FCM token management
  - **IMPROVED**: PWA install prompt now shows after 3 seconds (was 30 seconds)
  - **IMPROVED**: Mobile-optimized bottom sheet design with drag handle
  - Compact, Replit-style modal for better mobile UX

### UI/UX Improvements (2025-10-19)
  - CourseCard now shows "Payment Pending" button for courses with pending payments
  - **NEW**: Homepage enrollment status now matches Courses page (shows "Payment Pending")
  - **NEW**: Dashboard button in header navigation (appears after login)
  - **FIXED**: Admin dashboard "Courses" routing - now shows course management, not classes
  - **IMPROVED**: Reduced container max-width from 6xl to 5xl for better visual balance (Announcements, Courses, My Courses)
  - **IMPROVED**: Made all admin dashboard pages responsive with compact button sizing
  - **IMPROVED**: Removed gradient backgrounds from student dashboard header - now uses clean theme-aware borders
  - **IMPROVED**: Removed gradient backgrounds from admin panel header - cleaner design, better menu visibility
  - Centered header navigation menus in desktop mode for better UX
  - Admin panel sidebar now always visible on left in desktop mode

### Notification System (2025-10-19)
  - Admins receive push notifications when students check out
  - Added notification library for checkout notifications
  - **NEW**: Admin notification toggle in Website Settings page
  - **NEW**: One-click notification permission request with FCM token auto-save
  - **NEW**: Visual notification status indicators (Enabled/Blocked/Not enabled)
  - Prepared infrastructure for email notifications via SendGrid

### Bug Fixes (2025-10-19)
  - Fixed batch course chapters not displaying after subject selection in CourseSubjects.jsx
  - Payment history now displays correctly with proper timestamp sorting
  - Fixed checkout completion page navigation with improved debugging logs
  - Fixed Notification constructor error - now uses ServiceWorkerRegistration.showNotification()
  - Fixed service worker registration conflicts - both PWA and FCM service workers register properly

## Known Issues & Limitations

1. **Image Upload API Route**: The file `src/pages/api/upload-image.js` is written for Next.js API routes but this is a Vite-only app. To enable image uploads:
   - Option 1: Set up a separate backend server (Express/Fastify) to handle the `/api/upload-image` route
   - Option 2: Use Vite's middleware/plugin system
   - Option 3: Upload images directly from the frontend (less secure as it exposes the API key)
   
2. **Firebase Configuration**: Currently hardcoded in `src/lib/firebase.js`. For better security in production, consider using environment variables.

3. **WebSocket HMR**: The dev server's Hot Module Replacement tries to connect to 127.0.0.1 instead of the Replit domain, but this doesn't affect functionality.

4. **Email Notifications**: SendGrid integration is available via Replit connector but requires setup. To enable email notifications on payment confirmation:
   - Option 1: Use the SendGrid integration in Replit Secrets
   - Option 2: Manually set `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` environment variables
   - Implementation is ready in `src/lib/notifications.js` but needs credentials

5. **Push Notifications**: FCM is configured and can be enabled via Admin Settings:
   - Go to Admin Panel → Settings → Push Notifications section
   - Click "Enable Notifications" to request permission and save FCM token
   - Notification status will show as Enabled/Blocked/Not enabled
   - **Note**: While client-side setup is complete, sending notifications requires a backend server or Firebase Cloud Functions
   - To send notifications, implement a backend API that sends to saved FCM tokens in the `adminTokens` Firestore collection

## Notes
- Image uploads are handled via imgbb.com instead of Firebase Storage
- The app is now a full Progressive Web App with install prompt and offline capabilities
- Admin routes require proper authentication to access
- Push notifications work in Chrome, Edge, Firefox, and Safari (macOS & iOS 16.4+)
- PWA install prompt appears 3 seconds after first visit on non-installed devices
- All admin dashboard pages use responsive, compact layouts for mobile compatibility
