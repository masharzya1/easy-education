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

## Recent Work Completed (October 26, 2025 - Latest Session)

### Session 5: Critical Bug Fixes ✅
**Completed Tasks (1-4):**

1. **Task 1: Fixed Archived Class Display Issues** ✓
   - **Problem**: Empty subjects/chapters were showing when their classes were archived
   - **Solution**: Added validation in CourseSubjects.jsx and CourseChapters.jsx to only show subjects/chapters that have active/non-archived classes
   - **Impact**: Cleaner UI - no more empty/nested subject displays
   - **Files changed**: `src/pages/CourseSubjects.jsx`, `src/pages/CourseChapters.jsx`

2. **Task 2: Fixed Exam Routing Inconsistency** ✓
   - **Problem**: Continue course button and exam links used different routing methods (slug vs ID), causing "exam questions not found" errors
   - **Solution**: Updated ExamList.jsx and CourseDetail.jsx to support both slug-based and ID-based navigation
   - **Impact**: All exam navigation now works seamlessly regardless of routing method
   - **Files changed**: `src/pages/ExamList.jsx`, `src/pages/CourseDetail.jsx`

3. **Task 3: Fixed Archived Exams and Back Button** ✓
   - **Problem 1**: Archived exams couldn't be retaken - forced into review mode
   - **Problem 2**: "Back to Exams" button was getting overlapped by other UI elements
   - **Solution**: 
     - Removed automatic review mode activation for archived exams in ExamView.jsx
     - Added `z-50` to "Back to Exams" button in ExamResult.jsx
   - **Impact**: Users can now retake archived exams unlimited times; navigation button always visible
   - **Files changed**: `src/pages/ExamView.jsx`, `src/pages/ExamResult.jsx`

4. **Task 4: Updated Footer Layout** ✓
   - **Problem**: Footer needed better organization per user requirements
   - **Solution**: Restructured footer to have:
     - Top row: Brand | Quick Links | Contact (with email, phone, support bot, support ID)
     - Below: "Follow Us" section as standalone section
     - Removed separate "Support" heading (support links now under Contact)
   - **Impact**: Cleaner, more organized footer layout
   - **Files changed**: `src/components/Footer.jsx`

### Session 4: Performance Optimization - Lazy Loading ✅
**Completed Task 1:**

**Image Performance Optimization** ✓
   - **Problem**: Images were loading all at once, causing slow page performance
   - **Solution**: Implemented comprehensive lazy loading strategy
   - **Changes Made**:
     1. Added `loading="lazy"` attribute to all image components:
        - `src/components/CourseCard.jsx` - Course thumbnail images
        - `src/pages/CourseSubjects.jsx` - Subject images  
        - `src/pages/CourseChapters.jsx` - Chapter images (both archive and regular)
        - `src/pages/CourseClasses.jsx` - Already had lazy loading ✓
     2. Implemented image preloading for exams (`src/pages/ExamView.jsx`):
        - All question images and option images now preload before exam starts
        - Shows "Loading Images..." indicator during preload
        - Prevents exam from starting until all images are loaded
        - Ensures smooth exam experience without image loading delays
   - **Impact**: Significantly improved page load times and user experience across the platform

### Session 3: UI & Image Enhancements + Critical Bug Fix ✅
**Completed Tasks (3, 5, 9, 11):**

1. **Task 3: Archived Classes Tab System** ✓
   - Added tab toggle between "Active Classes" and "Archived Classes" in ManageClasses.jsx
   - Archived classes now show with orange "Archived" badge
   - Fixed order calculation bug for new classes (always uses active class count regardless of current tab)
   - Users can now view and manage archived classes separately

2. **Task 5: Class Image Upload/Link** ✓
   - Added dual image options to class management (upload to ImgBB + image link)
   - Implemented toggle between "Upload Image" and "Image Link" in class form
   - Added image preview for link-based images
   - Follows same pattern as Subjects and Chapters

3. **Task 9: Image Display in UI** ✓
   - Added image display to class cards in CourseClasses.jsx
   - Images show at top of card (48px height, full width) when imageURL exists
   - Implemented proper fallback: shows Play icon if no image or image fails to load
   - Added lazy loading (`loading="lazy"`) for performance
   - Error handling with state tracking to show fallback on broken image URLs

4. **Task 11: CRITICAL - Fixed Exam Submission Error with CQ Answers** ✓
   - **Root cause**: wrongAnswers filter was checking ALL questions (MCQ + CQ) against correctAnswer field
   - **Problem**: CQ questions don't have correctAnswer field → undefined comparison → submission failed
   - **Solution**: Modified wrongAnswers filter in ExamContext.jsx to only check MCQ questions (line 211: `if (q.type !== "mcq") return false`)
   - **Result**: Exam submissions now work perfectly with CQ text answers and image uploads
   - **Files changed**: `src/contexts/ExamContext.jsx` (lines 208-221)

### Session 2: Core Admin Features ✅ 
**Completed Tasks (1-4, 13):**

1. **Verified Image Upload/Link for Subjects and Chapters** ✓
   - Subjects and Chapters already have dual image options (upload to ImgBB or image URL)
   - Both ManageSubjects.jsx and ManageChapters.jsx fully functional
   - UI includes toggle between "Upload Image" and "Image Link"

2. **Fixed Class Creation Filtering** ✓
   - Fixed course-based subject selection in ManageClasses.jsx
   - Subjects now filter by selected course
   - Chapters filter by selected subjects (batch courses) or course (non-batch)
   - Resolves issue where all subjects/chapters were showing instead of filtered list

3. **Added Order Fields to Exams and Questions** ✓
   - Exams: Added order field with auto-increment and descending sort
   - Questions: Added order field with auto-increment and descending sort
   - Updated ExamContext.jsx to sort questions by order (descending) with createdAt fallback
   - Latest items now display first across all admin panels

4. **Enabled Multiple Course Selection for Subjects** ✓
   - Subjects can now be assigned to multiple courses (courseIds array)
   - Updated ManageSubjects.jsx with multi-select UI (pill-based selection)
   - Maintains backwards compatibility by saving both courseIds[] and legacy courseId
   - Updated all consumers: ManageSubjects, ManageChapters, ManageClasses filtering
   - Bulk creation also supports multi-course architecture

13. **Footer Layout Verification** ✓
    - Confirmed footer already has correct layout (Contact → Support → Follow Us)
    - No changes needed - already properly structured

### Previous Session: Initial Features ✅
1. **Image Upload/Link for Subjects and Chapters**
2. **Order Field for Teachers**  
3. **Firebase Rules Fix - Community Features**
4. **Footer & Menu Verification**

### Important Files Modified (Session 5 - Current)
1. `src/pages/CourseSubjects.jsx` - Filter to show only subjects with active classes
2. `src/pages/CourseChapters.jsx` - Filter to show only chapters with active classes
3. `src/pages/ExamList.jsx` - Support both slug and ID-based routing
4. `src/pages/CourseDetail.jsx` - Support both slug and ID-based routing
5. `src/pages/ExamView.jsx` - Remove archived exam review mode restriction
6. `src/pages/ExamResult.jsx` - Increase "Back to Exams" button z-index
7. `src/components/Footer.jsx` - Restructure footer layout

### Important Files Modified (Session 4 - Current)
1. `src/components/CourseCard.jsx` - Added lazy loading to course thumbnails
2. `src/pages/CourseSubjects.jsx` - Added lazy loading to subject images
3. `src/pages/CourseChapters.jsx` - Added lazy loading to chapter images
4. `src/pages/ExamView.jsx` - Implemented image preloading before exam starts

### Important Files Modified (Session 3)
1. `src/pages/admin/ManageClasses.jsx` - Course-based subject/chapter filtering
2. `src/pages/admin/ManageSubjects.jsx` - Multiple course selection, backwards compatibility
3. `src/pages/admin/ManageChapters.jsx` - CourseIds array support in filtering
4. `src/pages/admin/ManageExams.jsx` - Order field, auto-increment, sorting
5. `src/pages/admin/ManageExamQuestions.jsx` - Order field, auto-increment, sorting
6. `src/contexts/ExamContext.jsx` - Question sorting by order

### Next Steps for Continued Development
1. Read `TASK_STATUS.md` for full task details and implementation guidance
2. Complete remaining order field work (Exams, Questions)
3. Fix exam submission errors (tasks 14-16)
4. Deploy updated firestore.rules to Firebase Console to enable community features
5. Test all changes with workflow restart

### Firebase Rules Deployment
⚠️ **Important**: The updated `firestore.rules` file must be deployed to Firebase:
1. Go to Firebase Console → Firestore Database → Rules
2. Copy content from local `firestore.rules` file
3. Publish the rules
4. This will immediately fix community post/comment visibility