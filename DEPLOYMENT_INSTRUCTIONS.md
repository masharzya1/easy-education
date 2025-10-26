# Firebase Security Rules Deployment Instructions

## Important: Deploy Firebase Security Rules

The file `firestore.rules` contains the complete Firebase security rules for this project. These rules **must be deployed** to fix community posts and comments not showing.

### How to Deploy:

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the entire content from `firestore.rules` file
5. Paste it into the rules editor
6. Click **Publish** button

### What These Rules Do:

- **Community Posts & Comments**: Enable authenticated users to read all posts, create their own posts, and edit/delete only their own content
- **Exams & Results**: Allow all users to read exams, but only authenticated users can submit results
- **Admin Operations**: Restrict course/subject/chapter/class management to admin users only
- **User Privacy**: Users can only access their own payment records and notifications
- **Security**: Prevent unauthorized access to sensitive collections

### Verification:

After deploying, verify that:
- Users can see community posts and comments
- Non-admin users cannot modify courses, subjects, chapters
- Users can submit exam results but cannot modify others' results
- Admin users can access all admin features
- Users can only access their own profile data (not others')

### Important Note:

If community posts/comments need to display usernames or profile pictures from other users, ensure that user display data (name, photo) is embedded directly in post/comment documents rather than requiring lookups to the users collection. The users collection is now restricted to owner/admin access only for privacy protection.

---

**Status**: ⚠️ **Awaiting Deployment** - These rules are NOT active until deployed via Firebase Console
