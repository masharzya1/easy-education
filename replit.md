# Easy Education - Free Online Courses Platform

### Overview
Easy Education is a React-based Progressive Web App (PWA) providing a comprehensive platform for free online courses. It includes features for course management, user authentication, announcements, news, payment tracking, and robust assessment tools like course-level exams and student analytics. The platform aims to offer a user-friendly and effective educational experience.

### User Preferences
I prefer iterative development with clear communication on proposed changes. Please ask before making major architectural changes or significant modifications to existing features. I appreciate detailed explanations for complex implementations.

### System Architecture
The platform is built using React 18.2.0 with Vite, styled with TailwindCSS and Radix UI. Firebase provides authentication (Google OAuth included) and Firestore database services. Image uploads are handled by the imgbb.com API. React Router DOM manages routing, and state is managed with React Context API. It functions as a PWA with service worker support for offline capabilities.

**UI/UX Decisions:**
- Responsive design optimized for mobile.
- Theme-aware elements (Dark/Light mode) and a clean, modern aesthetic.
- Support for Bangla language and Bangladeshi Taka (৳) currency.
- Consistent UI components like `CourseCard` across the platform.

**Technical Implementations & Feature Specifications:**
- **User Management**: Authentication via email/password and Google OAuth, user profiles, and rankings.
- **Course Management**: Browsing, enrollment, course/chapter/class management, and archiving.
- **Content Delivery**: Integrated video player with custom controls.
- **Assessment System**: Course-level exams with MCQ and Creative Questions, image support, student tracking, exam history, analytics, and admin JSON bulk upload. Unlimited exam retakes are allowed, with options to view solutions, leaderboards, and all attempts.
- **Payment System**: Integrated ZiniPay gateway for automated processing (bKash, Nagad, Rocket, credit/debit cards), including a coupon system and webhook-based course enrollment.
- **Notification System**: PWA push notifications via Firebase Cloud Messaging (FCM) and email notifications via SendGrid.
- **Admin Dashboard**: Comprehensive interface for managing courses, users, payments, exams, and settings, including bulk creation tools and student removal.
- **PWA Capabilities**: Full PWA support with install prompts, offline access, and background push notifications.
- **Backend Architecture**: Express.js server handles API routes for payment processing, image uploads, and enrollment, and serves the Vite application.
- **Class Resources**: Admins can add dynamic resource links (e.g., PDFs, external links) to classes, displayed on the CourseWatch page.
- **PDF Viewer**: Integration of Google Drive's native viewer for inline PDF viewing from Google Drive links.
- **Telegram Integration**: Form to collect user Telegram ID and mobile number, appearing on the first page after continuing a course, with direct link to course Telegram group.

### External Dependencies
- **Firebase**: Authentication (Firebase Auth) and Database (Firestore).
- **ZiniPay**: Payment gateway.
- **imgbb.com API**: For image uploads.
- **SendGrid**: For email notifications.
- **React Router DOM**: For client-side routing.
- **Radix UI**: For unstyled, accessible UI components.
- **Vite**: Build tool and development server.
- **TailwindCSS**: For utility-first CSS styling.
- **Express.js**: Backend server for API routes and serving the frontend.