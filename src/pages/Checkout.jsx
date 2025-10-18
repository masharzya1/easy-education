"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingCart, Tag, CreditCard, ArrowLeft, AlertCircle } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function Checkout() {
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()
  const { cartItems, getTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState("")
  const [paymentInstructions, setPaymentInstructions] = useState("")

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
    fetchPaymentInstructions()
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

  const fetchPaymentInstructions = async () => {
    try {
      const settingsRef = collection(db, "settings")
      const settingsQuery = query(settingsRef, where("type", "==", "payment"))
      const snapshot = await getDocs(settingsQuery)

      if (!snapshot.empty) {
        const settings = snapshot.docs[0].data()
        setPaymentInstructions(settings.instructions || "Please pay to 018XXXXXXXX via bKash")
      } else {
        setPaymentInstructions("Please pay to 018XXXXXXXX via bKash")
      }
    } catch (error) {
      console.error("Error fetching payment instructions:", error)
      setPaymentInstructions("Please pay to 018XXXXXXXX via bKash")
    }
  }

  const validateCoupon = async () => {
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
  }

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0

    const subtotal = getTotal()
    if (appliedCoupon.discountType === "percentage") {
      return (subtotal * appliedCoupon.discountPercent) / 100
    } else {
      return appliedCoupon.discountAmount
    }
  }

  const calculateTotal = () => {
    const subtotal = getTotal()
    const discount = calculateDiscount()
    return Math.max(0, subtotal - discount)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.senderNumber || !formData.transactionId) {
      alert("Please fill in all required fields")
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
        const currentCourseIds = new Set(cartItems.map((c) => c.id))

        if (
          existingCourseIds.size === currentCourseIds.size &&
          [...existingCourseIds].every((id) => currentCourseIds.has(id))
        ) {
          alert(
            "You already have a pending payment for these courses. Please wait for admin approval or contact support.",
          )
          setLoading(false)
          return
        }
      }

      const discount = calculateDiscount()
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
        discount: discount,
        couponCode: appliedCoupon?.code || "",
        finalAmount: calculateTotal(),
        status: "pending",
        submittedAt: serverTimestamp(),
      }

      await addDoc(collection(db, "payments"), paymentData)

      clearCart()
      navigate("/checkout-complete")
    } catch (error) {
      console.error("Error submitting payment:", error)
      alert("Failed to submit payment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const subtotal = getTotal()
  const discount = calculateDiscount()
  const total = calculateTotal()

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container-balanced">
        <button
          onClick={() => navigate("/courses")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate mr-2">{item.title}</span>
                      <span className="font-medium flex-shrink-0">৳{item.price || 0}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>৳{subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>
                        Discount
                        {appliedCoupon.discountType === "percentage" ? ` (${appliedCoupon.discountPercent}%)` : ""}:
                      </span>
                      <span>-৳{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span>৳{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Coupon Input */}
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Have a coupon?</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="COUPON CODE"
                      className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm smooth-transition"
                      disabled={!!appliedCoupon}
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={!!appliedCoupon}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium smooth-transition"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                  {couponError && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400">{couponError}</p>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <Tag className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Coupon {appliedCoupon.code} applied successfully!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary" />
                  Payment Details
                </h2>

                {/* Payment Instructions */}
                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold mb-2">Payment Instructions</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{paymentInstructions}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sender Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.senderNumber}
                      onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      placeholder="Enter transaction ID"
                      className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed smooth-transition"
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
