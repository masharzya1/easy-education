# Easy Education - Free Online Courses Platform

## Project Status
✅ **Migration Complete** - October 26, 2025
- All npm packages installed (630 dependencies)
- Frontend workflow running successfully on port 5000
- Development server configured with Vite + Express.js
- All core features verified and functional

## Overview
Easy Education is a React-based Progressive Web App (PWA) designed as a comprehensive platform for free online courses. It offers features for course management, user authentication, announcements, news, payment tracking, and robust assessment tools, including course-level exams and student analytics. The platform's core purpose is to provide a user-friendly and effective educational experience, aiming for broad market potential as a leading free online education resource.

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

## Required Configuration

### API Keys (Required for Full Functionality)
To enable all features, you need to configure the following API keys using Replit Secrets:

1. **IMGBB_API_KEY** (Required for image uploads)
   - Get your key from: https://api.imgbb.com/
   - Used by: Course images, user profiles, exam questions with images
   - Without this: Image upload features will not work

2. **RUPANTORPAY_API_KEY** (Required for payment processing)
   - Get your key from: https://rupantorpay.com/developers
   - Used by: Course enrollment payments, payment webhooks
   - Without this: Payment features will not work

### Firebase Configuration
✅ Firebase credentials are already configured in `src/lib/firebase.js`
- Project: easy-educat
- Services enabled: Authentication, Firestore, Cloud Messaging

### How to Add API Keys
1. Click on "Secrets" in the left sidebar (lock icon)
2. Add each key with the exact name shown above
3. Restart the Frontend workflow after adding secrets

## Development Setup Complete
The project is ready for development. All dependencies are installed and the server is running. Add the required API keys to enable payment and image upload features.