import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

let db;
let messaging;

function initializeFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      try {
        // Try to use Application Default Credentials (ADC)
        initializeApp({
          credential: applicationDefault(),
          projectId: 'easy-educat'
        });
      } catch (error) {
        // If ADC is not available, initialize with project ID only
        // This will work for Firestore operations in some environments
        console.warn('Firebase Admin SDK initialized with limited credentials. Some operations may fail.');
        initializeApp({
          projectId: 'easy-educat'
        });
      }
    }
  }
  db = getFirestore();
  try {
    messaging = getMessaging();
  } catch (error) {
    console.warn('Firebase Messaging not initialized:', error.message);
  }
}

async function notifyAdminsOfEnrollment(enrollmentData) {
  if (!db) {
    initializeFirebase();
  }
  
  try {
    const adminTokensSnapshot = await db
      .collection('adminTokens')
      .where('role', '==', 'admin')
      .get();
    
    if (adminTokensSnapshot.empty) {
      console.log('No admin tokens found for notification');
      return;
    }

    const tokens = adminTokensSnapshot.docs
      .map(doc => doc.data().token)
      .filter(Boolean);
    
    if (tokens.length === 0) {
      console.log('No valid admin tokens for notification');
      return;
    }

    const courseNames = enrollmentData.courses?.map(c => c.title).join(', ') || 'N/A';
    const coursesText = enrollmentData.courses?.length > 1 
      ? `${enrollmentData.courses.length} courses` 
      : enrollmentData.courses?.[0]?.title || 'Unknown Course';
    
    const isFree = enrollmentData.isFreeEnrollment || enrollmentData.finalAmount === 0;

    const message = {
      notification: {
        title: isFree ? 'New Free Enrollment 🎓' : 'New Course Enrollment 💰',
        body: `${enrollmentData.userName || 'A user'} enrolled in ${coursesText}${isFree ? ' (Free)' : ` for ৳${enrollmentData.finalAmount}`}. Click to view details.`,
      },
      data: {
        url: '/admin/payments',
        userId: enrollmentData.userId || '',
        type: 'enrollment',
        userName: enrollmentData.userName || '',
        userEmail: enrollmentData.userEmail || '',
        courses: courseNames,
        isFree: String(isFree)
      },
      tokens: tokens
    };

    if (messaging) {
      const response = await messaging.sendEachForMulticast(message);
      console.log(`Admin enrollment notification sent successfully to ${response.successCount}/${tokens.length} admin(s)`);
      
      if (response.failureCount > 0) {
        console.log('Failed tokens:', response.responses.filter(r => !r.success).map((r, i) => ({ token: tokens[i], error: r.error })));
      }
    } else {
      console.log('Firebase Messaging not available, skipping admin notification');
    }
  } catch (error) {
    console.error('Error notifying admins of enrollment:', error);
  }
}

export async function processPaymentAndEnrollUser(paymentData) {
  if (!db) {
    initializeFirebase();
  }

  const {
    userId,
    userName,
    userEmail,
    transactionId,
    trxId,
    paymentMethod,
    courses,
    subtotal,
    discount,
    couponCode,
    finalAmount,
    currency
  } = paymentData;

  try {
    const existingPaymentQuery = await db
      .collection('payments')
      .where('transactionId', '==', transactionId)
      .where('status', '==', 'approved')
      .limit(1)
      .get();

    if (!existingPaymentQuery.empty) {
      console.log(`Payment ${transactionId} already processed`);
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Payment already processed'
      };
    }

    const paymentRecord = {
      userId,
      userName,
      userEmail,
      transactionId,
      invoiceId: paymentData.invoiceId || transactionId,
      trxId: trxId || transactionId,
      paymentMethod: paymentMethod || 'ZiniPay',
      courses: courses || [],
      subtotal: parseFloat(subtotal || finalAmount),
      discount: parseFloat(discount || 0),
      couponCode: couponCode || '',
      finalAmount: parseFloat(finalAmount),
      status: 'approved',
      submittedAt: FieldValue.serverTimestamp(),
      approvedAt: FieldValue.serverTimestamp(),
      paymentGateway: 'ZiniPay',
      currency: currency || 'BDT'
    };

    await db.collection('payments').add(paymentRecord);

    if (courses && courses.length > 0) {
      const batch = db.batch();
      
      for (const course of courses) {
        const userCourseRef = db.collection('userCourses').doc(`${userId}_${course.id}`);
        batch.set(userCourseRef, {
          userId,
          courseId: course.id,
          enrolledAt: FieldValue.serverTimestamp(),
          progress: 0
        }, { merge: true });
      }
      
      await batch.commit();
      console.log(`Successfully enrolled user ${userId} in ${courses.length} course(s)`);
      
      try {
        await notifyAdminsOfEnrollment({
          userId,
          userName,
          userEmail,
          courses,
          finalAmount,
          isFreeEnrollment: finalAmount === 0
        });
      } catch (notifyError) {
        console.error('Failed to notify admins:', notifyError);
      }
    }

    return {
      success: true,
      alreadyProcessed: false,
      message: 'Payment processed and user enrolled successfully',
      paymentRecord
    };

  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
