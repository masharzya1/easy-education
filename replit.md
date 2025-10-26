# Easy Education - Free Online Courses Platform

## Overview
Easy Education is a React-based Progressive Web App (PWA) designed to be a comprehensive platform for free online courses. It offers features for course management, user authentication, announcements, news, payment tracking, and robust assessment tools, including course-level exams and student analytics. The platform's core purpose is to provide a user-friendly and effective educational experience, aiming for broad market potential as a leading free online education resource.

## User Preferences
I prefer iterative development with clear communication on proposed changes. Please ask before making major architectural changes or significant modifications to existing features. I appreciate detailed explanations for complex implementations.

## System Architecture
The platform is a React 18.2.0 PWA built with Vite, styled using TailwindCSS and Radix UI. Firebase provides authentication (including Google OAuth) and Firestore database services. Image uploads are handled via the imgbb.com API. React Router DOM manages client-side routing, and state is managed with React Context API. The application supports offline capabilities through service workers. An Express.js backend handles API routes for payment processing, image uploads, and enrollment, and serves the frontend.

**UI/UX Decisions:**
- Responsive design optimized for mobile devices.
- Support for Dark/Light mode with a clean, modern aesthetic.
- Localization support for Bangla language and Bangladeshi Taka (৳) currency.
- Consistent UI components, such as `CourseCard`.

**Technical Implementations & Feature Specifications:**
- **User Management**: Authentication (email/password, Google OAuth), user profiles, and ranking systems.
- **Course Management**: Features for course browsing, enrollment, creation, chapter/class organization, and archiving.
- **Content Delivery**: Integrated video player with custom controls.
- **Assessment System**: Course-level exams with Multiple Choice and Creative Questions, image support, student tracking, exam history, analytics, and admin bulk JSON upload for questions. Includes unlimited retakes, solution viewing, leaderboards, and attempt history.
- **Payment System**: Integration with RupantorPay for automated payments (bKash, Nagad, Rocket, credit/debit cards), including a coupon system and webhook-based course enrollment.
- **Notification System**: PWA push notifications via Firebase Cloud Messaging (FCM) and email notifications via SendGrid.
- **Admin Dashboard**: Comprehensive interface for managing courses, users, payments, exams, and settings, including bulk creation tools.
- **PWA Capabilities**: Full PWA support with install prompts, offline access, and background push notifications.
- **Class Resources**: Dynamic resource links (e.g., PDFs, external links) can be added to classes and viewed on the CourseWatch page, with Google Drive's native viewer for inline PDF display.
- **Telegram Integration**: Collects user Telegram ID and mobile number, provides a direct link to the course Telegram group.

## External Dependencies
- **Firebase**: Authentication (Firebase Auth), Database (Firestore), and Cloud Messaging (FCM).
- **RupantorPay**: Payment gateway.
- **imgbb.com API**: Image uploads.
- **SendGrid**: Email notifications.
- **React Router DOM**: Client-side routing.
- **Radix UI**: Unstyled, accessible UI components.
- **Vite**: Build tool and development server.
- **TailwindCSS**: Utility-first CSS styling.
- **Express.js**: Backend server.

## Recent Changes (October 26, 2025)

### Project Import Completed ✓
1. **NPM Dependencies Installed** - All 630 packages installed successfully
2. **Frontend Workflow Running** - Express server with Vite dev server running on port 5000
3. **Application Verified** - Homepage loads correctly with all navigation working

### Critical Bug Fixes ✓

1. **Fixed Exam Submission Errors (Issues #14, #20, #22, #18)**
   - **Problem**: Exams accessed via slug URL couldn't be submitted because the submission function was using the slug instead of the Firebase document ID
   - **Solution**: Added `actualExamId` state variable to store the resolved Firebase ID from slug lookup and use it consistently throughout the component
   - **Impact**: Students can now successfully submit exams regardless of whether they access via slug or direct ID
   - **Files Modified**: `src/pages/ExamView.jsx`

2. **Fixed Checkout Page Reload Issue (Issue #16)**
   - **Problem**: Page would redirect to /courses when reloaded because cart appeared empty during loading
   - **Solution**: Reordered the useEffect logic to check authentication first, then wait for cart/coupon to load before checking if cart is empty
   - **Impact**: Users can now reload the checkout page without losing their cart
   - **Files Modified**: `src/pages/Checkout.jsx`
   - **Note**: The 100% discount coupon already displays "Enroll Now" button correctly (line 405-415)

3. **Updated Firebase Security Rules (Issue #23)**
   - **Problem**: Rules were too restrictive - users couldn't view other profiles or enrollment data needed for leaderboards and rankings
   - **Solution**: Updated `/users` and `/userCourses` collections to allow all signed-in users to read (while maintaining write restrictions)
   - **Impact**: Community features, leaderboards, and rankings will now work correctly
   - **Files Modified**: `firestore.rules`
   - **Action Required**: User must deploy these rules to Firebase Console → Firestore Database → Rules → Publish

### Testing Recommendations
Before continuing development, please test:
1. Submit an exam using a slug URL (e.g., `/exam/my-exam-slug`) to verify end-to-end submission works
2. Reload the checkout page while logged in to confirm no unwanted redirect
3. Test free enrollment with a 100% discount coupon to verify "Enroll Now" button appears
4. Deploy `firestore.rules` to Firebase Console for community features to work

### Known Remaining Issues
See the detailed issue list in the initial project documentation for additional features and improvements that can be implemented.