"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingCart, Tag, CreditCard, ArrowLeft, AlertCircle } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
import { sendLocalNotification, requestNotificationPermission } from "../lib/pwa"
import { notifyAdminsOfCheckout } from "../lib/notifications"
import { toast } from "../hooks/use-toast"

export default function Checkout() {
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()
  const { cartItems, getTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState("")
  const [paymentInstructions, setPaymentInstructions] = useState("")
  const [purchasedCourses, setPurchasedCourses] = useState(new Set())

  const [formData, setFormData] = useState({
    senderNumber: "",
    transactionId: "",
    name: userProfile?.name || "",
    email: userProfile?.email || "",
  })

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }
    if (cartItems.length === 0) {
      navigate("/courses")
      return
    }

    const fetchInitialData = async () => {
      try {
        // Fetch payment instructions
        const settingsRef = collection(db, "settings")
        const settingsQuery = query(settingsRef, where("type", "==", "payment"))
        const settingsSnapshot = await getDocs(settingsQuery)

        if (!settingsSnapshot.empty) {
          const settings = settingsSnapshot.docs[0].data()
          setPaymentInstructions(settings.instructions || "Please pay to 018XXXXXXXX via bKash")
        }

        // Fetch purchased courses
        const approvedPaymentQuery = query(
          collection(db, "payments"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "approved"),
        )
        const approvedSnapshot = await getDocs(approvedPaymentQuery)

        const purchased = new Set()
        approvedSnapshot.docs.forEach((doc) => {
          const payment = doc.data()
          payment.courses?.forEach((c) => {
            purchased.add(c.id)
          })
        })
        setPurchasedCourses(purchased)
      } catch (error) {
        console.error("Error fetching initial data:", error)
      }
    }

    fetchInitialData()
  }, [currentUser, cartItems, navigate])

  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        name: userProfile.name || "",
        email: userProfile.email || "",
      }))
    }
  }, [userProfile])

  const validateCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    setCouponError("")

    try {
      const couponsRef = collection(db, "coupons")
      const q = query(couponsRef, where("code", "==", couponCode.toUpperCase()))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setCouponError("Invalid coupon code")
        return
      }

      const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }

      if (!coupon.active) {
        setCouponError("This coupon is no longer active")
        return
      }

      if (coupon.expiryDate && coupon.expiryDate.toDate() < new Date()) {
        setCouponError("This coupon has expired")
        return
      }

      const subtotal = getTotal()
      if (coupon.minCartValue && subtotal < coupon.minCartValue) {
        setCouponError(`Minimum cart value of ৳${coupon.minCartValue} required for this coupon`)
        return
      }

      if (coupon.applicableCourses && coupon.applicableCourses.length > 0) {
        const applicableItems = cartItems.filter((item) => coupon.applicableCourses.includes(item.id))
        if (applicableItems.length === 0) {
          setCouponError("This coupon is not applicable to any items in your cart")
          return
        }
      }

      setAppliedCoupon(coupon)
      setCouponError("")
    } catch (error) {
      console.error("Error validating coupon:", error)
      setCouponError("Failed to validate coupon")
    }
  }, [couponCode, cartItems, getTotal])

  const calculateDiscount = useMemo(() => {
    if (!appliedCoupon) return 0
    const subtotal = getTotal()
    if (appliedCoupon.discountType === "percentage") {
      return (subtotal * appliedCoupon.discountPercent) / 100
    } else {
      return appliedCoupon.discountAmount
    }
  }, [appliedCoupon, getTotal])

  const calculateTotal = useMemo(() => {
    const subtotal = getTotal()
    return Math.max(0, subtotal - calculateDiscount)
  }, [getTotal, calculateDiscount])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.senderNumber || !formData.transactionId) {
      toast({
        variant: "error",
        title: "Missing Information",
        description: "Please fill in all required fields",
      })
      return
    }

    const alreadyPurchased = cartItems.filter((item) => purchasedCourses.has(item.id))
    if (alreadyPurchased.length > 0) {
      toast({
        variant: "warning",
        title: "Already Purchased",
        description: `You have already purchased ${alreadyPurchased.length} course(s) in your cart. Please remove them before checkout.`,
      })
      return
    }

    setLoading(true)

    try {
      const existingPaymentQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "pending"),
      )
      const existingPaymentSnapshot = await getDocs(existingPaymentQuery)

      if (!existingPaymentSnapshot.empty) {
        const existingPayment = existingPaymentSnapshot.docs[0].data()
        const existingCourseIds = new Set(existingPayment.courses?.map((c) => c.id) || [])
        const currentCheckoutIds = new Set(cartItems.map((c) => c.id))

        if (
          existingCourseIds.size === currentCheckoutIds.size &&
          [...existingCourseIds].every((id) => currentCheckoutIds.has(id))
        ) {
          toast({
            variant: "warning",
            title: "Pending Payment Exists",
            description: "You already have a pending payment for these exact courses. Please wait for admin approval or contact support.",
          })
          setLoading(false)
          return
        }

        const hasOverlap = [...currentCheckoutIds].some((id) => existingCourseIds.has(id))
        if (hasOverlap) {
          toast({
            variant: "warning",
            title: "Duplicate Courses",
            description: "Some courses in your cart are already in a pending payment. Please wait for approval or remove them.",
          })
          setLoading(false)
          return
        }
      }

      console.log("Submitting payment with data:", {
        userId: currentUser.uid,
        courses: cartItems.length,
        total: calculateTotal
      })

      const paymentData = {
        userId: currentUser.uid,
        userName: formData.name,
        userEmail: formData.email,
        senderNumber: formData.senderNumber,
        transactionId: formData.transactionId,
        courses: cartItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price || 0,
        })),
        subtotal: getTotal(),
        discountType: appliedCoupon?.discountType || "none",
        discountPercent: appliedCoupon?.discountPercent || 0,
        discountAmount: appliedCoupon?.discountAmount || 0,
        discount: calculateDiscount,
        couponCode: appliedCoupon?.code || "",
        finalAmount: calculateTotal,
        status: "pending",
        submittedAt: serverTimestamp(),
      }

      const paymentDocRef = await addDoc(collection(db, "payments"), paymentData)
      console.log("Payment document created with ID:", paymentDocRef.id)

      try {
        await addDoc(collection(db, "adminNotifications"), {
          type: 'new_payment',
          userName: formData.name,
          userEmail: formData.email,
          amount: calculateTotal,
          courseCount: cartItems.length,
          transactionId: formData.transactionId,
          paymentId: paymentDocRef.id,
          read: false,
          createdAt: serverTimestamp()
        })
        console.log("Admin notification created successfully")
      } catch (error) {
        console.error('Failed to create admin notification:', error)
      }

      await requestNotificationPermission()
      sendLocalNotification('Payment Submitted! 🎉', {
        body: `Your payment of ৳${calculateTotal} has been submitted for ${cartItems.length} course(s). You'll be notified once it's approved.`,
        tag: 'payment-submitted',
        requireInteraction: false
      })

      notifyAdminsOfCheckout({
        id: paymentDocRef.id,
        name: formData.name,
        totalAmount: calculateTotal,
        courseCount: cartItems.length,
      }).catch(err => console.error('Failed to notify admins:', err))

      const coursesForState = [...cartItems]
      clearCart()
      
      console.log("Navigating to checkout-complete page")
      navigate("/checkout-complete", { 
        state: { 
          courses: coursesForState, 
          paymentData: {
            ...paymentData,
            id: paymentDocRef.id
          }
        },
        replace: true
      })
    } catch (error) {
      console.error("Error submitting payment:", error)
      console.error("Error details:", error.message, error.code)
      toast({
        variant: "error",
        title: "Payment Submission Failed",
        description: error.message || "Failed to submit payment. Please try again or contact support.",
      })
    } finally {
      setLoading(false)
    }
  }

  const subtotal = getTotal()
  const discount = calculateDiscount
  const total = calculateTotal

  return (
    <div className="min-h-screen py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/courses")}
          className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6 lg:sticky lg:top-24">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">Order Summary</h2>

                <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 max-h-40 sm:max-h-48 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                      <span className="truncate mr-2">{item.title}</span>
                      <span className="font-medium flex-shrink-0">৳{item.price || 0}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-2 sm:pt-3 space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Subtotal:</span>
                    <span>৳{subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400">
                      <span>
                        Discount
                        {appliedCoupon.discountType === "percentage" ? ` (${appliedCoupon.discountPercent}%)` : ""}:
                      </span>
                      <span>-৳{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm sm:text-base pt-1.5 sm:pt-2 border-t">
                    <span>Total:</span>
                    <span>৳{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Coupon Input */}
                <div className="mt-4 sm:mt-6">
                  <label className="block text-xs sm:text-sm font-medium mb-2">Have a coupon?</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="COUPON CODE"
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm"
                      disabled={!!appliedCoupon}
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={!!appliedCoupon}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-xs sm:text-sm font-medium"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                  {couponError && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400">{couponError}</p>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-600 dark:text-green-400">Coupon {appliedCoupon.code} applied!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
                  Payment Details
                </h2>

                {/* Payment Instructions */}
                <div className="mb-4 sm:mb-6 p-2 sm:p-3 lg:p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base mb-1 sm:mb-2">Payment Instructions</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line">{paymentInstructions}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                      Sender Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.senderNumber}
                      onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                      Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      placeholder="Enter transaction ID"
                      className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 sm:py-3 lg:py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm lg:text-base"
                  >
                    {loading ? "Submitting..." : "Submit Payment"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
