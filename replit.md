# Easy Education - Free Online Courses Platform

### Overview
Easy Education is a React-based Progressive Web App (PWA) designed to provide free online courses. It offers a comprehensive learning platform with features for course management, user authentication, announcements, news, and payment tracking. The platform aims to deliver a robust educational experience with capabilities like course-level exams, student assessments, and detailed analytics, all within a user-friendly interface.

### User Preferences
I prefer iterative development with clear communication on proposed changes. Please ask before making major architectural changes or significant modifications to existing features. I appreciate detailed explanations for complex implementations.

### System Architecture
The platform is built using React 18.2.0 with Vite, styled with TailwindCSS and Radix UI primitives for a modern and responsive user interface. Firebase handles both authentication (Firebase Auth with Google OAuth) and data storage (Firebase Firestore). Image uploads are managed via the imgbb.com API. Routing is handled by React Router DOM, and state management utilizes React Context API. The application is a Progressive Web App (PWA) with service worker support for offline capabilities and enhanced user experience.

**Key Features & Implementations:**
- **User Management**: Authentication via email/password and Google OAuth, with user profiles and rankings.
- **Course Management**: Comprehensive system for browsing, enrolling, and managing courses, chapters, and classes. Includes archiving functionality for seamless course transitions. Course status badges (running/ongoing) are displayed consistently across all pages using the CourseCard component.
- **Content Delivery**: Integrated video player with custom controls (10-second skip forward/backward, double-click gestures).
- **Assessment System**: Course-level exams with MCQ and Creative Questions, supporting text and image options. Includes student assessment tracking, exam history, and analytics. Admins can bulk create exams and questions via JSON upload.
- **Payment System**: Integrated RupantorPay payment gateway for automated payment processing (API v1.0). Supports bKash, Nagad, Rocket, and credit/debit cards. Includes coupon system with percentage and fixed-amount discounts. Payment verification and automatic course enrollment via webhook. See `RUPANTORPAY_INTEGRATION.md` for detailed documentation.
- **Notification System**: PWA push notifications via Firebase Cloud Messaging (FCM) for announcements and admin alerts (e.g., student checkouts). Email notifications via SendGrid are pre-integrated.
- **UI/UX**: Responsive design with a focus on mobile optimization. Consistent branding with theme-aware elements (Dark/Light mode) and a clean, modern aesthetic. Bangla language and Bangladeshi Taka (৳) currency support are integrated.
- **Admin Dashboard**: A dedicated interface for managing all aspects of the platform, including courses, users, payments, exams, and website settings. Features include student removal from courses, bulk creation tools, and comprehensive content management.
- **PWA Capabilities**: Full PWA support with install prompts, offline access, and background push notifications.

### External Dependencies
- **Firebase**: Used for Authentication (Firebase Auth) and Database (Firestore).
- **ZiniPay**: Payment gateway for automated payment processing (API key stored in ZINIPAY_API_KEY secret). Migrated from RupantorPay on October 25, 2025.
- **imgbb.com API**: For image uploads, particularly for exam questions and options.
- **SendGrid**: Integrated for sending email notifications (requires API key setup).
- **React Router DOM**: For client-side routing.
- **Radix UI**: For unstyled, accessible UI components.
- **Vite**: As the build tool and development server.
- **TailwindCSS**: For utility-first CSS styling.

### Backend Architecture
The application now uses an Express.js server that serves both the Vite development environment and handles API routes:
- **Server**: Express server (server.js) running on port 5000
- **Development**: Vite middleware integrated with Express for hot module replacement
- **Production**: Serves built static files from /dist directory
- **API Routes**: RESTful endpoints for payment processing, image uploads, and enrollment

### Notes
- **Google Sheets Integration**: User declined Google Sheets connector setup. If automatic student purchase data export to Google Sheets is needed in the future, either use the connector (connector:ccfg_google-sheet_E42A9F6CA62546F68A1FECA0E8) or implement custom integration with Google Sheets API credentials.

### Recent Changes (October 25, 2025)

**Session 1: Payment Gateway Migration**
1. **Migrated to RupantorPay Payment Gateway with Metadata Fix**
   - Updated all API endpoints to use RupantorPay API (https://payment.rupantorpay.com/api/*)
   - Authentication via `X-API-KEY` header
   - **CRITICAL FIX: Resolved metadata handling bug that caused "userId not found" errors**
     * Metadata is now sent as JSON object (not double-stringified)
     * Proper parsing of metadata in webhook and verification responses
     * Handles both string and object metadata formats for compatibility
     * Added extensive logging for debugging metadata issues
   - Fixed all three previous payment issues:
     * Payment link creation failures (metadata now properly formatted)
     * "Transaction ID not found" errors (improved verification)
     * "userId not found in metadata" errors (proper metadata parsing throughout flow)
   - Updated RUPANTORPAY_INTEGRATION.md with metadata fix documentation
   - Enhanced error handling throughout payment flow
   - Environment variable: RUPANTORPAY_API_KEY

**Session 2: Checkout Coupon Fix, Teacher Display & Course Card Improvements**
2. **Checkout Page Reload Fix**
   - Fixed issue where 100% discount coupon was lost on page reload
   - Implemented sessionStorage persistence for applied coupons
   - Added cart loading state (isLoaded) to CartContext to prevent premature redirects
   - Checkout now waits for both cart and coupon data to load before validating
   - Session coupon is properly cleared after successful enrollment or payment
   - Prevents redirect to /courses when checkout page is reloaded with valid cart

3. **Teacher Display in Course Details**
   - Added comprehensive teacher information display on CourseDetail page
   - Teachers are fetched from Firestore based on course.instructors array
   - Displays in horizontal card layout with teacher picture, name, expertise, and bio
   - Teacher cards show profile image (left side), name/expertise/description (right side)
   - Section only appears when course has assigned teachers
   - Supports up to 10 teachers per course query

4. **Course Card UI Enhancement**
   - Changed "Add to Cart" button to "Buy Now" button on all course cards
   - Buy Now button navigates directly to course details page for purchase flow
   - Price display maintained and prominently shown on course cards
   - Consistent across both home page and courses page
   - Simplifies user journey from browsing to course details

5. **Express.js Downgrade**
   - Downgraded Express from v5.1.0 to v4.x for better ES module compatibility
   - Fixed ERR_MODULE_NOT_FOUND errors in development environment

**Session 3: Course Watch Enhancements & UI Improvements**
6. **Checkout Page Reload Bug Fix**
   - Fixed critical bug where reloading checkout page would redirect to /courses
   - Added proper loading state checks for both cart (isCartLoaded) and coupon (isCouponLoaded)
   - Prevents navigation until both states are fully loaded
   - Maintains coupon state across page reloads using sessionStorage
   - Ensures 100% discount coupons work correctly after page refresh

7. **Course Details - Removed Static Content**
   - Removed generic "This course includes" section with static features
   - Cleaned up sidebar to focus on actual course purchase options
   - Streamlined course detail page for better user experience

8. **Telegram Integration in Course Watch**
   - Added Telegram community section in CourseWatch page
   - Join button with direct link to course's Telegram group (course.telegramLink)
   - Student information submission form (one-time per course per user):
     * Auto-filled webapp account name (from user profile)
     * Auto-filled webapp account email (from user account)
     * Telegram ID input field (manual entry)
     * Mobile number input field (manual entry)
   - Form submission stored in Firestore collection "telegramSubmissions"
   - Prevents duplicate submissions per course per user
   - Success/error feedback with toast notifications
   - Visual confirmation when information already submitted

### Previous Changes (October 24, 2025)
1. **Payment Integration Infrastructure**
   - Created Express server to handle API routes and serve Vite app
   - Implemented server-side payment processing with Firebase Admin SDK
   - Created shared payment processing utility (api/utils/process-payment.js) for idempotent enrollment
   - Updated webhook to verify payments and automatically enroll users
   - Created /api/process-enrollment endpoint for secure payment verification from frontend
   - Added security validation to prevent payment fraud (userId verification from metadata)
   - Both webhook and frontend redirect paths automatically enroll students without admin approval
   - Installed firebase-admin package for server-side Firestore operations

2. **API Endpoints**
   - POST /api/create-payment: Creates RupantorPay payment link with metadata
   - POST /api/verify-payment: Verifies payment status with RupantorPay
   - POST /api/payment-webhook: Processes webhook notifications and enrolls users
   - POST /api/process-enrollment: Verifies and processes enrollment from frontend (with security validation)
   - POST /api/upload-image: Handles image uploads to imgbb.com

3. **Security Enhancements**
   - Payment metadata includes userId to prevent unauthorized enrollments
   - API validates userId matches payment metadata before processing
   - Idempotent payment processing prevents duplicate enrollments

4. **Course Card Consistency**: Refactored Home and Courses pages to use shared CourseCard component
   - Eliminated duplicate course card rendering logic
   - Ensured consistent course status badge display across all pages
   - Improved code maintainability and reduced bundle size

5. **Draft Course Filtering**: Confirmed draft courses are properly filtered from public pages for non-admin users