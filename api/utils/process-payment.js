import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let db;

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
      initializeApp();
    }
  }
  db = getFirestore();
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
      trxId: trxId || transactionId,
      paymentMethod: paymentMethod || 'RupantorPay',
      courses: courses || [],
      subtotal: parseFloat(subtotal || finalAmount),
      discount: parseFloat(discount || 0),
      couponCode: couponCode || '',
      finalAmount: parseFloat(finalAmount),
      status: 'approved',
      submittedAt: FieldValue.serverTimestamp(),
      approvedAt: FieldValue.serverTimestamp(),
      paymentGateway: 'RupantorPay',
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
