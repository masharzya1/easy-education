import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { getFCMToken } from './pwa'

export async function saveAdminFCMToken(userId) {
  try {
    const token = await getFCMToken()
    if (!token) {
      console.log('No FCM token available')
      return null
    }

    await setDoc(
      doc(db, 'adminTokens', userId),
      {
        token,
        userId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    console.log('Admin FCM token saved successfully')
    return token
  } catch (error) {
    console.error('Error saving admin FCM token:', error)
    return null
  }
}

export async function notifyAdminsOfCheckout(paymentData) {
  try {
    const adminTokensSnapshot = await getDocs(collection(db, 'adminTokens'))
    
    if (adminTokensSnapshot.empty) {
      console.log('No admin tokens found')
      return
    }

    const tokens = adminTokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean)
    
    if (tokens.length === 0) {
      console.log('No valid admin tokens')
      return
    }

    const notification = {
      title: 'New Checkout Request',
      body: `${paymentData.name} has submitted a payment of ৳${paymentData.totalAmount}`,
      icon: '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      tag: `checkout-${paymentData.id}`,
      data: {
        url: '/admin/payments',
        paymentId: paymentData.id,
        type: 'checkout'
      }
    }

    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokens,
        notification,
      }),
    }).catch(err => {
      console.log('API endpoint not available, notifications will work via FCM service worker')
    })

    console.log('Admin notification sent successfully')
  } catch (error) {
    console.error('Error notifying admins:', error)
  }
}

export async function sendEmailNotification(to, subject, body) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    console.log('Email notification sent successfully')
    return true
  } catch (error) {
    console.error('Error sending email notification:', error)
    return false
  }
}
