# Easy Education - Free Online Courses Platform

### Overview
Easy Education is a React-based Progressive Web App (PWA) designed to provide free online courses. It offers a comprehensive learning platform with features for course management, user authentication, announcements, news, and payment tracking. The platform aims to deliver a robust educational experience with capabilities like course-level exams, student assessments, and detailed analytics, all within a user-friendly interface.

### User Preferences
I prefer iterative development with clear communication on proposed changes. Please ask before making major architectural changes or significant modifications to existing features. I appreciate detailed explanations for complex implementations.

### System Architecture
The platform is built using React 18.2.0 with Vite, styled with TailwindCSS and Radix UI primitives for a modern and responsive user interface. Firebase handles both authentication (Firebase Auth with Google OAuth) and data storage (Firebase Firestore). Image uploads are managed via the imgbb.com API. Routing is handled by React Router DOM, and state management utilizes React Context API. The application is a Progressive Web App (PWA) with service worker support for offline capabilities and enhanced user experience.

**Key Features & Implementations:**
- **User Management**: Authentication via email/password and Google OAuth, with user profiles and rankings.
- **Course Management**: Comprehensive system for browsing, enrolling, and managing courses, chapters, and classes. Includes archiving functionality for seamless course transitions.
- **Content Delivery**: Integrated video player with custom controls (10-second skip forward/backward, double-click gestures).
- **Assessment System**: Course-level exams with MCQ and Creative Questions, supporting text and image options. Includes student assessment tracking, exam history, and analytics. Admins can bulk create exams and questions via JSON upload.
- **Notification System**: PWA push notifications via Firebase Cloud Messaging (FCM) for announcements and admin alerts (e.g., student checkouts). Email notifications via SendGrid are pre-integrated.
- **UI/UX**: Responsive design with a focus on mobile optimization. Consistent branding with theme-aware elements (Dark/Light mode) and a clean, modern aesthetic. Bangla language and Bangladeshi Taka (৳) currency support are integrated.
- **Admin Dashboard**: A dedicated interface for managing all aspects of the platform, including courses, users, payments, exams, and website settings. Features include student removal from courses, bulk creation tools, and comprehensive content management.
- **PWA Capabilities**: Full PWA support with install prompts, offline access, and background push notifications.

### External Dependencies
- **Firebase**: Used for Authentication (Firebase Auth) and Database (Firestore).
- **imgbb.com API**: For image uploads, particularly for exam questions and options.
- **SendGrid**: Integrated for sending email notifications (requires API key setup).
- **React Router DOM**: For client-side routing.
- **Radix UI**: For unstyled, accessible UI components.
- **Vite**: As the build tool and development server.
- **TailwindCSS**: For utility-first CSS styling.