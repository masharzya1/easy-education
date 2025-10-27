# Easy Education - Free Online Courses Platform

## Overview
Easy Education is a React-based Progressive Web App (PWA) providing a comprehensive platform for free online courses. It includes features for course management, user authentication, announcements, news, payment tracking, and robust assessment tools like course-level exams and student analytics. The platform aims to deliver a user-friendly and effective educational experience, aspiring to be a leading free online education resource with broad market potential.

## Recent Changes (October 27, 2025)
- **PWA Icon Fix & Install Button**: Fixed critical PWA installation issue where icons were incorrectly sized (256x144 instead of required 192x192 and 512x512). Generated proper PWA icons using Sharp, updated manifest and service worker to use correct icon files. Enhanced install button logic to show for all users (including in iframes) with improved fallback instructions when native install prompt is unavailable.
- **PWA Installation Enhancement**: Updated the install prompt to show clear, browser-specific installation instructions when the native install prompt is not available, ensuring users can properly install the app instead of just creating shortcuts.
- **Course Tagging System**: Added a tagging feature to courses (maximum 6 tags per course). Tags are now displayed on course cards instead of descriptions for better visual hierarchy and discoverability.
- **Clean URL Slugs**: Removed random ID suffixes from course slugs for cleaner, more readable URLs (e.g., `/course/react-fundamentals` instead of `/course/react-fundamentals-abc12345`).
- **Comprehensive Firestore Security Rules**: Created complete security rules for all 23 collections in the application, fixing the community comments visibility issue where comments weren't showing due to incorrect field name checks (authorId vs userId).

## User Preferences
I prefer iterative development with clear communication on proposed changes. Please ask before making major architectural changes or significant modifications to existing features. I appreciate detailed explanations for complex implementations.

## System Architecture
Easy Education is a React 18.2.0 PWA built with Vite, styled using TailwindCSS and Radix UI. Firebase handles authentication (including Google OAuth) and Firestore database services. Image uploads are managed via the imgbb.com API. Client-side routing is handled by React Router DOM, and state management uses the React Context API. The application supports offline capabilities through service workers. An Express.js backend provides API routes for payment processing, image uploads, and enrollment, and serves the frontend.

**UI/UX Decisions:**
- Responsive design optimized for mobile devices.
- Support for Dark/Light mode with a clean, modern aesthetic.
- Localization support for Bangla language and Bangladeshi Taka (৳) currency.
- Consistent UI components, such as `CourseCard`.

**Technical Implementations & Feature Specifications:**
- **User Management**: Authentication, user profiles, and ranking systems.
- **Course Management**: Browsing, enrollment, creation, chapter/class organization, archiving, and course tagging (up to 6 tags per course).
- **Content Delivery**: Integrated video player with custom controls.
- **Assessment System**: Course-level exams (MCQ, Creative Questions), image support, student tracking, exam history, analytics, admin bulk JSON upload, unlimited retakes, solution viewing, and leaderboards.
- **Payment System**: Integration with RupantorPay (bKash, Nagad, Rocket, credit/debit cards), coupon system, and webhook-based course enrollment.
- **Notification System**: PWA push notifications via Firebase Cloud Messaging (FCM) and email notifications via SendGrid.
- **Admin Dashboard**: Comprehensive management interface for courses, users, payments, exams, and settings, including bulk creation tools.
- **PWA Capabilities**: Full PWA support with improved install prompts showing clear browser-specific instructions, offline access, and background push notifications.
- **Class Resources**: Dynamic resource links (e.g., PDFs, external links) displayed on the CourseWatch page, with Google Drive's native viewer for inline PDF display.
- **Telegram Integration**: Collects user Telegram ID and mobile number, provides a direct link to the course Telegram group.

## External Dependencies
- **Firebase**: Authentication, Firestore Database, Cloud Messaging (FCM).
- **RupantorPay**: Payment gateway.
- **imgbb.com API**: Image uploads.
- **SendGrid**: Email notifications.
- **React Router DOM**: Client-side routing.
- **Radix UI**: Unstyled, accessible UI components.
- **Vite**: Build tool and development server.
- **TailwindCSS**: Utility-first CSS styling.
- **Express.js**: Backend server.