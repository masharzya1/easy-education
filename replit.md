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
- Payment management
- Announcements and news
- Website settings
- User rankings

## Recent Changes
- 2025-10-19: Initial project import to Replit
- Configured Vite to allow all hosts for Replit proxy support
- Set up development workflow on port 5000
- Installed all npm dependencies
- **PWA Enhancements (2025-10-19)**:
  - Added Firebase Cloud Messaging for push notifications
  - Created PWA install prompt modal component with beforeinstallprompt handler
  - Updated manifest.json with gcm_sender_id for FCM compatibility
  - Created firebase-messaging-sw.js service worker for background notifications
  - Added notification permission handling and FCM token management
- **UI/UX Improvements (2025-10-19)**:
  - CourseCard now shows "Request Pending" button for courses with pending payments
  - Redesigned Dashboard with modern color palette (blue, purple, amber, emerald gradients)
  - Centered header navigation menus in desktop mode for better UX
  - Admin panel sidebar now always visible on left in desktop mode
  - Updated admin panel header with gradient background styling
- **Bug Fixes (2025-10-19)**:
  - Fixed batch course chapters not displaying after subject selection in CourseSubjects.jsx
  - Payment history now displays correctly with proper timestamp sorting
- **Notification System (2025-10-19)**:
  - Admins receive push notifications when students check out
  - Added notification library for checkout notifications
  - Prepared infrastructure for email notifications via SendGrid

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

5. **Push Notifications**: FCM is configured but requires:
   - Admin users to allow notifications in their browser
   - Admin FCM tokens to be saved (call `saveAdminFCMToken()` after login)
   - Replace placeholder VAPID key in `src/lib/pwa.js` with actual key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates

## Notes
- Image uploads are handled via imgbb.com instead of Firebase Storage
- The app is now a full Progressive Web App with install prompt and offline capabilities
- Admin routes require proper authentication to access
- Push notifications work in Chrome, Edge, Firefox, and Safari (macOS & iOS 16.4+)
- PWA install prompt appears 30 seconds after first visit (can be customized)
