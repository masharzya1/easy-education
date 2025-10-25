"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingCart, Tag, CreditCard, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { toast } from "../hooks/use-toast"

export default function Checkout() {
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()
  const { cartItems, getTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState("")
  const [purchasedCourses, setPurchasedCourses] = useState(new Set())

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }
    if (cartItems.length === 0) {
      navigate("/courses")
      return
    }

    const fetchPurchasedCourses = async () => {
      try {
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
        console.error("Error fetching purchased courses:", error)
      }
    }

    fetchPurchasedCourses()
  }, [currentUser, cartItems, navigate])

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

  const handleCheckout = async () => {
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
      const finalTotal = calculateTotal
      const finalDiscount = calculateDiscount
      const subtotalAmount = getTotal()
      
      const metadata = {
        userId: currentUser.uid,
        courses: cartItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price) || 0,
        })),
        subtotal: parseFloat(subtotalAmount.toFixed(2)),
        discount: parseFloat(finalDiscount.toFixed(2)),
        couponCode: appliedCoupon?.code || "",
      }

      // If total is 0 (100% discount), directly enroll user without payment
      if (finalTotal === 0) {
        const enrollResponse = await fetch('/api/process-enrollment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            userName: userProfile?.name || currentUser.displayName || "User",
            userEmail: userProfile?.email || currentUser.email,
            transaction_id: `FREE_${Date.now()}_${currentUser.uid}`,
            courses: metadata.courses,
            subtotal: metadata.subtotal,
            discount: metadata.discount,
            couponCode: metadata.couponCode,
            finalAmount: 0,
            paymentMethod: 'Free Coupon',
            skipPaymentVerification: true
          })
        })

        const enrollData = await enrollResponse.json()

        if (enrollData.success) {
          clearCart()
          toast({
            variant: "success",
            title: "Enrolled Successfully!",
            description: "You have been enrolled in the course(s) for free!",
          })
          navigate('/checkout-complete', { 
            state: { 
              courses: metadata.courses,
              isFreeEnrollment: true 
            } 
          })
        } else {
          throw new Error(enrollData.error || "Failed to process free enrollment")
        }
        return
      }

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullname: userProfile?.name || currentUser.displayName || "User",
          email: userProfile?.email || currentUser.email,
          amount: finalTotal.toFixed(2),
          metadata: metadata
        })
      })

      const data = await response.json()

      if (data.success && data.payment_url) {
        clearCart()
        window.location.href = data.payment_url
      } else {
        // Handle error - ensure it's always a string
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : (data.error?.message || data.message || "Failed to create payment link. Please try again.")
        
        toast({
          variant: "error",
          title: "Payment Failed",
          description: errorMessage,
        })
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      
      // Ensure error is always a string
      const errorMessage = typeof error === 'string'
        ? error
        : (error?.message || "Failed to process payment request. Please try again.")
      
      toast({
        variant: "error",
        title: "Payment Error",
        description: errorMessage,
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

            {/* Payment Section */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
                  Payment Method
                </h2>

                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold text-sm lg:text-base mb-2">Secure Payment with RupantorPay</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    You will be redirected to RupantorPay's secure payment page where you can pay using:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm text-muted-foreground">
                    <li>• bKash, Nagad, Rocket</li>
                    <li>• Credit/Debit Cards</li>
                    <li>• Other supported payment methods</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Customer Name:</span>
                      <span className="text-sm">{userProfile?.name || currentUser?.displayName || "User"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Email:</span>
                      <span className="text-sm">{userProfile?.email || currentUser?.email}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full py-3 lg:py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : total === 0 ? (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Enroll Now
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Proceed to Payment
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-muted-foreground">
                    By proceeding, you agree to our terms and conditions. Your payment is secured by RupantorPay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
