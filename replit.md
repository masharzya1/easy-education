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
- **Course-Level Exam System** - MCQ and CQ questions with text or image options
- **Student Assessments** - Course-wide exams accessible from course subjects page and during video watching
- **Exam Analytics** - Track exam history, scores, and identify mistakes for improvement
- **Enhanced Video Player** - 10-second skip controls with buttons and double-click gestures

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
- **Manage Exams** - Create course-level exams with time limits, pass marks, and modern UI
- **Manage Questions** - Add MCQ and CQ (Creative Question) with text or image options via imgbb
- **Bulk Question Import** - Import multiple questions at once for faster exam setup

## Recent Changes
- 2025-10-19: Initial project import to Replit
- Configured Vite to allow all hosts for Replit proxy support
- Set up development workflow on port 5000
- Installed all npm dependencies
- **FIXED**: Notification constructor error - now using ServiceWorkerRegistration.showNotification() for proper PWA notifications
- **FIXED**: Service worker registration - both PWA and Firebase Messaging service workers now register correctly
- **NEW**: Added visible PWA install button in header that appears when app is installable
- All dependencies installed and project fully functional

### PWA Enhancements (2025-10-19 to 2025-10-20)
  - Added Firebase Cloud Messaging for push notifications
  - Created PWA install prompt modal component with beforeinstallprompt handler
  - Updated manifest.json with gcm_sender_id for FCM compatibility
  - Created firebase-messaging-sw.js service worker for background notifications
  - Added notification permission handling and FCM token management
  - **IMPROVED**: PWA install button now shows after 1 second (was 3 seconds)
  - **NEW**: PWA install button persists in header if app is not installed
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

### Archive & Bulk Creation Features (2025-10-19)
  - **NEW**: Archive system for transferring classes from old courses (e.g., HSC26) to new courses (e.g., HSC27)
  - **NEW**: Archive appears as a separate section in batch courses with archived classes
  - **NEW**: Archive navigation with special orange-themed styling to distinguish from regular subjects
  - **NEW**: Bulk subject creation - create multiple subjects at once for batch-type courses
  - **NEW**: Bulk chapter creation - create multiple chapters at once with course/subject selection
  - **NEW**: Course filtering in subject and chapter management pages
  - **IMPROVED**: Smart filtering handles both array and string values for subjects/chapters
  - **IMPROVED**: Archive classes properly display in course navigation flow
  - **IMPROVED**: Consistent navigation breadcrumbs throughout archive and regular course flows

### Course-Level Exam System (2025-10-20)
  - **NEW**: Complete course-level exam management system with ExamContext for state management
  - **NEW**: Admin can create exams at course level (not class-specific) with time limits and pass marks
  - **NEW**: Admin can add Multiple Choice Questions (MCQ) with 4 options (A, B, C, D)
  - **NEW**: Admin can add Creative Questions (CQ) with custom text-based questions
  - **NEW**: Image upload support for both questions and answer options via imgbb API
  - **NEW**: Exam card on CourseSubjects page showing number of available exams for the course
  - **NEW**: Exams accessible during video watching in CourseWatch page (displays up to 3 exams)
  - **NEW**: ExamList page (`/course/:courseId/exams`) showing all course exams with completion status
  - **NEW**: Student exam interface with timer, question navigation, and answer submission
  - **NEW**: Exam results stored in Firestore with wrong answers tracked for analytics
  - **NEW**: Analytics page (`/analytics`) showing exam history, scores, and mistakes for improvement
  - **NEW**: Pass/fail status displayed after exam completion based on passing score
  - **NEW**: Admin routes for exam management: `/admin/exams` and `/admin/exam-questions`
  - **IMPROVED**: Modern exam management UI with bulk question import capability
  - **IMPROVED**: Responsive exam card design with visual indicators for locked/available exams
  - **IMPROVED**: Real-time exam timer with auto-submit when time expires
  - **FIXED**: Analytics stats now properly update using useMemo hook
  - **FIXED**: ExamView null check added to prevent crashes when exam data is loading

### Video Player Enhancements (2025-10-20)
  - **NEW**: 10-second skip forward button with SkipForward icon
  - **NEW**: 10-second skip backward button with SkipBack icon
  - **NEW**: Double-click left side of video to skip backward 10 seconds
  - **NEW**: Double-click right side of video to skip forward 10 seconds
  - **IMPROVED**: Single-click play/pause with delayed action to prevent conflicts
  - **FIXED**: Double-click no longer triggers twice (was skipping 20 seconds)

### Bug Fixes (2025-10-19)
  - Fixed batch course chapters not displaying after subject selection in CourseSubjects.jsx
  - Payment history now displays correctly with proper timestamp sorting
  - Fixed checkout completion page navigation with improved debugging logs
  - Fixed Notification constructor error - now uses ServiceWorkerRegistration.showNotification()
  - Fixed service worker registration conflicts - both PWA and FCM service workers register properly
  - Fixed archive routing to properly filter and display archived classes
  - Fixed subject/chapter extraction to handle both array and string field values

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
- PWA install button appears 1 second after first visit and persists if app not installed
- All admin dashboard pages use responsive, compact layouts for mobile compatibility
