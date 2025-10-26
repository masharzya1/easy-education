# Easy Education - Free Online Courses Platform

## Overview
Easy Education is a React-based Progressive Web App (PWA) providing a comprehensive platform for free online courses. It includes features for course management, user authentication, announcements, news, payment tracking, and robust assessment tools like course-level exams and student analytics. The platform aims to offer a user-friendly and effective educational experience.

## User Preferences
I prefer iterative development with clear communication on proposed changes. Please ask before making major architectural changes or significant modifications to existing features. I appreciate detailed explanations for complex implementations.

## System Architecture
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
- **Payment System**: Integrated RupantorPay gateway for automated processing (bKash, Nagad, Rocket, credit/debit cards), including a coupon system and webhook-based course enrollment.
- **Notification System**: PWA push notifications via Firebase Cloud Messaging (FCM) and email notifications via SendGrid.
- **Admin Dashboard**: Comprehensive interface for managing courses, users, payments, exams, and settings, including bulk creation tools and student removal.
- **PWA Capabilities**: Full PWA support with install prompts, offline access, and background push notifications.
- **Backend Architecture**: Express.js server handles API routes for payment processing, image uploads, and enrollment, and serves the Vite application.
- **Class Resources**: Admins can add dynamic resource links (e.g., PDFs, external links) to classes, displayed on the CourseWatch page.
- **PDF Viewer**: Integration of Google Drive's native viewer for inline PDF viewing from Google Drive links.
- **Telegram Integration**: Form to collect user Telegram ID and mobile number, appearing on the first page after continuing a course, with direct link to course Telegram group.

## External Dependencies
- **Firebase**: Authentication (Firebase Auth) and Database (Firestore).
- **RupantorPay**: Payment gateway (previously ZiniPay).
- **imgbb.com API**: For image uploads.
- **SendGrid**: For email notifications.
- **React Router DOM**: For client-side routing.
- **Radix UI**: For unstyled, accessible UI components.
- **Vite**: Build tool and development server.
- **TailwindCSS**: For utility-first CSS styling.
- **Express.js**: Backend server for API routes and serving the frontend.

## Recent Changes (October 26, 2025)

### Completed Tasks ✓

1. **Footer Contact Information Updated** (Task 24)
   - Added Contact section with email and phone:
     - Email: easyeducation556644@gmail.com
     - Phone: +880969752197
   - Updated Support section:
     - Support Bot: @Chatbox67_bot
     - Support ID: @eesupport01
   - Updated Follow Us section:
     - Telegram: https://t.me/Easy_Education_01
     - YouTube 01: https://youtube.com/@easyeducation19
     - YouTube 02: https://youtube.com/@easyeducation-01
   - File: `src/components/Footer.jsx`

2. **Admin Dashboard Menu Reordered** (Task 11)
   - New order: Overview, Notifications, Users, Categories, Courses, Subjects, Chapters, Classes, Exams, Exam Results, CQ Submissions, Teachers, Announcements, Coupons, Payments, Telegram Subs, Settings, Rankings
   - File: `src/pages/admin/AdminDashboard.jsx`

3. **Description Field Removed from Subjects** (Task 4)
   - Removed description field from Subject add/edit modal forms
   - Removed description from bulk subject creation
   - Removed description display in subject cards
   - Updated formData state to exclude description
   - File: `src/pages/admin/ManageSubjects.jsx`

4. **Description Field Removed from Chapters** (Task 5)
   - Removed description field from Chapter add/edit modal forms
   - Removed description from bulk chapter creation
   - Removed description display in chapter cards
   - Updated formData state to exclude description
   - File: `src/pages/admin/ManageChapters.jsx`

5. **Fixed npm dependencies issue**
   - Reinstalled all npm packages (630 packages) after node_modules was missing
   - Frontend workflow now running successfully

### Pending High-Priority Tasks

#### Critical Issues (User-Blocking)

1. **Issue #14: Exam Submission Error**
   - Exam submission is failing with errors
   - Needs investigation in `src/pages/ExamView.jsx` and `src/contexts/ExamContext.jsx`

2. **Issue #22: CQ Box Error**
   - Writing in CQ box or uploading images causes errors preventing exam submission
   - Check CQ question handling in ExamView.jsx

3. **Issue #20: Exam Submission General Error**
   - Related to #14, needs debugging in exam submission flow

4. **Issue #16: Checkout Page Issues**
   - Reload redirects to courses page instead of staying
   - 100% discount coupon shows "Proceed to payment" instead of "Enroll now"
   - Check: `src/pages/Checkout.jsx`

5. **Issue #18: Routing Inconsistency**
   - Continue course button uses slug-based routing from course card
   - Continue course button uses ID-based routing from course details
   - This causes exam/question lookup failures
   - Files to check: CourseCard component, CourseDetail page, ExamView routing

#### Important Functional Fixes

6. **Issue #1 & #2: Dual Image Upload/Link System**
   - Subjects and Chapters need both upload (imgbb) and link options
   - Reference implementation exists in `src/pages/admin/ManageClasses.jsx` (lines 33-36, 176-179, 222-226)
   - Pattern: 
     - Add `imageType: "upload"` or "link" to formData
     - Add `imageLink: ""` field
     - Toggle buttons to switch between upload/link
     - Handle both in submit function
   - Files to update: `ManageSubjects.jsx`, `ManageChapters.jsx`

7. **Issue #3: Class Creation Filters Not Working**
   - Course-based subject filtering doesn't work in class creation
   - Subject-based chapter filtering doesn't work  
   - All chapters show instead of filtered by subject
   - File: `src/pages/admin/ManageClasses.jsx`

8. **Issue #6-10: Add Order Fields**
   - Add "order" field to Subjects, Chapters, Teachers, Exams, Exam Questions
   - Auto-increment: if empty, use last number + 1
   - Sort display by order descending (latest first)
   - Pattern for each entity:
     ```javascript
     // In creation/update:
     order: formData.order || (existingItems.length > 0 ? Math.max(...existingItems.map(i => i.order || 0)) + 1 : 1)
     
     // In fetch/display:
     .sort((a, b) => (b.order || 0) - (a.order || 0))
     ```

9. **Issue #12: Multiple Course Selection for Subjects**
   - Subject Create & Edit should allow selecting multiple courses
   - Change from single select dropdown to multi-select with tags
   - Reference: ManageClasses.jsx lines 750-778 (multi-select subject pattern)
   - Update: Subject schema to support courseIds array instead of courseId

10. **Issue #13: Archived Classes Management**
    - Archived classes don't show in Manage Classes list
    - Need to either:
      - Add "Archived" badge to archived classes in main list, OR
      - Create separate tab for archived vs. active classes
    - File: `src/pages/admin/ManageClasses.jsx`

11. **Issue #17: Archived Class Problems**
    - Chapters showing first in archived classes
    - Subjects nesting inside each other when archiving
    - Root cause: likely conditional rendering when class doesn't exist
    - Check archiving logic in ManageClasses.jsx

12. **Issue #15: Image Loading Performance**
    - Images in chapters, subjects, classes, exams load synchronously causing slowness
    - During exams, all images load before exam starts
    - Implement lazy loading:
      - Use Intersection Observer API or React lazy loading library
      - Load images on scroll/page visit
      - Defer off-screen images
    - Files: All components displaying images

13. **Issue #19: Image Display Consistency**
    - Ensure all Chapters, Subjects, Classes show image + info when image exists
    - Just info when no image
    - Check card layouts across all management pages

#### Minor Fixes

14. **Issue #21: Archived Exam Issues**
    - Can't retake archived exams
    - "Back to exam" button z-index too low
    - Files: ExamView.jsx, exam-related components

15. **Issue #25: Dark Mode Issues**
    - Analytics, Exams, Exam View pages always show white background
    - Dark mode not applying correctly
    - Check className patterns and theme context usage
    - Files: `src/pages/Analytics.jsx`, `src/pages/ExamView.jsx`, exam-related pages

16. **Issue #23: Firebase Security Rules**
    - Community posts and comments not showing due to Firebase rules
    - Need complete security rules for:
      - Posts collection
      - Comments subcollection
      - Read/write permissions
    - Create file: `firestore.rules` (to be deployed via Firebase Console)

## Firebase Security Rules (Needed)

The user needs complete Firebase security rules for community functionality. Here's the recommended structure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/adminTokens/$(request.auth.uid));
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId) || isAdmin();
    }

    // Courses collection
    match /courses/{courseId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Subjects collection
    match /subjects/{subjectId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Chapters collection
    match /chapters/{chapterId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Classes collection
    match /classes/{classId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Exams collection
    match /exams/{examId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Exam questions
    match /examQuestions/{questionId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Exam results
    match /examResults/{resultId} {
      allow read: if isSignedIn() && 
                     (isOwner(resource.data.userId) || isAdmin());
      allow create: if isSignedIn() && 
                       isOwner(request.resource.data.userId);
      allow update, delete: if isAdmin();
    }

    // Community posts
    match /posts/{postId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && 
                       isOwner(request.resource.data.userId);
      allow update, delete: if isSignedIn() && 
                                (isOwner(resource.data.userId) || isAdmin());
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn() && 
                         isOwner(request.resource.data.userId);
        allow update, delete: if isSignedIn() && 
                                  (isOwner(resource.data.userId) || isAdmin());
      }
    }

    // Payments collection
    match /payments/{paymentId} {
      allow read: if isSignedIn() && 
                     (isOwner(resource.data.userId) || isAdmin());
      allow write: if isAdmin();
    }

    // User courses enrollment
    match /userCourses/{enrollmentId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Categories collection
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Teachers collection
    match /teachers/{teacherId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Announcements collection
    match /announcements/{announcementId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Coupons collection
    match /coupons/{couponId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && 
                     (isOwner(resource.data.userId) || isAdmin());
      allow write: if isAdmin();
    }

    // Admin tokens collection
    match /adminTokens/{userId} {
      allow read: if isSignedIn();
      allow write: if false; // Only admins can modify via backend
    }

    // Telegram submissions
    match /telegramSubmissions/{submissionId} {
      allow read: if isAdmin();
      allow create: if isSignedIn() && 
                       isOwner(request.resource.data.userId);
      allow update, delete: if isAdmin();
    }
  }
}
```

**To Deploy:**
1. Go to Firebase Console → Firestore Database → Rules
2. Paste the above rules
3. Click "Publish"

## Known Technical Debt

1. Image loading performance needs optimization (lazy loading)
2. Exam submission flow has multiple error points
3. Routing inconsistency between slug and ID-based navigation
4. Archived content management needs better UX
5. Order/sorting not implemented for most entities

## Next Agent Priority Tasks

### MUST FIX FIRST (Blocking Users):
1. Fix exam submission errors (#14, #20, #22)
2. Fix checkout page issues (#16)
3. Fix routing inconsistency (#18)
4. Deploy Firebase security rules (#23)

### HIGH PRIORITY (Important Features):
1. Implement dual image upload/link system for Subjects & Chapters (#1, #2)
2. Fix class creation filters (#3)
3. Add order fields to all entities (#6-10)
4. Enable multiple course selection for subjects (#12)
5. Fix archived classes display (#13, #17)

### MEDIUM PRIORITY (UX Improvements):
1. Implement lazy image loading (#15)
2. Fix image display consistency (#19)
3. Fix dark mode issues (#25)
4. Fix archived exam retake (#21)

## Development Notes for Next Agent

- Express server runs on port 5000 (server.js)
- All API endpoints are in /api/ directory
- Frontend uses Vite for bundling
- Image uploads go through imgbb API (/api/upload-image)
- Payment processing uses RupantorPay gateway
- Admin authentication uses Firebase adminTokens collection
- Always test changes by restarting the Frontend workflow
- Use parallel tool calls for efficiency
- Check logs with refresh_all_logs before marking tasks complete

## File Structure Reference

```
src/
├── components/         # Reusable UI components
│   ├── Footer.jsx     # ✓ Updated with new contact info
│   ├── CourseCard.jsx
│   └── ...
├── pages/
│   ├── admin/         # Admin dashboard pages
│   │   ├── AdminDashboard.jsx        # ✓ Menu reordered
│   │   ├── ManageSubjects.jsx        # ✓ Description removed
│   │   ├── ManageChapters.jsx        # ✓ Description removed
│   │   ├── ManageClasses.jsx         # TODO: Fix filters, add image options
│   │   ├── ManageExams.jsx           # TODO: Add order field
│   │   └── ...
│   ├── ExamView.jsx   # TODO: Fix submission errors
│   ├── Checkout.jsx   # TODO: Fix reload & discount issues
│   └── ...
├── contexts/          # React Context providers
│   ├── ExamContext.jsx
│   └── ...
└── lib/              # Utility libraries
    ├── firebase.js
    └── imgbb.js

api/
├── create-payment.js
├── payment-webhook.js
├── upload-image.js
└── process-enrollment.js

server.js             # Express server entry point
```

## Testing Checklist Before Deployment

- [ ] All exam flows working (create, take, submit, view results)
- [ ] Checkout with 100% discount enrolls correctly
- [ ] Archived classes visible and manageable
- [ ] Images load efficiently
- [ ] Dark mode works on all pages
- [ ] Community posts and comments visible
- [ ] Firebase rules deployed and tested
- [ ] Order fields working for all entities
- [ ] Subject multi-course selection working

---

Last Updated: October 26, 2025
Agent Token Usage: ~100k/200k tokens used
Status: In Progress - 4/26 tasks completed, 22 tasks remaining