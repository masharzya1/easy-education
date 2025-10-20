"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingCart, Play, BookOpen, Clock, Users, Tag, Check, AlertCircle } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addToCart, cartItems, removeFromCart } = useCart()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [hasPendingPayment, setHasPendingPayment] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [courseId, currentUser])

  useEffect(() => {
    if (course) {
      setIsInCart(cartItems.some((item) => item.id === course.id))
    }
  }, [cartItems, course])

  const fetchCourseData = async () => {
    try {
      const courseDoc = await getDoc(doc(db, "courses", courseId))
      if (courseDoc.exists()) {
        const courseData = { id: courseDoc.id, ...courseDoc.data() }
        setCourse(courseData)

        if (currentUser) {
          const paymentsQuery = query(
            collection(db, "payments"),
            where("userId", "==", currentUser.uid),
            where("status", "==", "approved"),
          )
          const paymentsSnapshot = await getDocs(paymentsQuery)

          const hasApprovedCourse = paymentsSnapshot.docs.some((doc) => {
            const payment = doc.data()
            return payment.courses?.some((c) => c.id === courseId)
          })
          setHasAccess(hasApprovedCourse)

          const pendingPaymentQuery = query(
            collection(db, "payments"),
            where("userId", "==", currentUser.uid),
            where("status", "==", "pending"),
          )
          const pendingPaymentSnapshot = await getDocs(pendingPaymentQuery)

          const hasPendingCourse = pendingPaymentSnapshot.docs.some((doc) => {
            const payment = doc.data()
            return payment.courses?.some((c) => c.id === courseId)
          })
          setHasPendingPayment(hasPendingCourse)
        }
      }
    } catch (error) {
      console.error("Error fetching course data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (course) {
      addToCart(course)
    }
  }

  const handleRemoveFromCart = () => {
    if (course) {
      removeFromCart(course.id)
    }
  }

  const handleBuyNow = () => {
    if (course) {
      addToCart(course)
      navigate("/checkout")
    }
  }

  const handleWatchNow = () => {
    if (course.type === "batch") {
      navigate(`/course/${courseId}/subjects`)
    } else {
      navigate(`/course/${courseId}/chapters`)
    }
  }

  const handleEnrollFree = async () => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    try {
      const { addDoc, serverTimestamp } = await import("firebase/firestore")

      await addDoc(collection(db, "payments"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        userEmail: currentUser.email,
        courses: [
          {
            id: course.id,
            title: course.title,
            price: 0,
          },
        ],
        subtotal: 0,
        discount: 0,
        finalAmount: 0,
        status: "approved",
        submittedAt: serverTimestamp(),
        isFreeEnrollment: true,
      })

      await fetchCourseData()
    } catch (error) {
      console.error("Error enrolling in free course:", error)
      alert("Failed to enroll. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl overflow-hidden"
            >
              {course.thumbnailURL ? (
                <img
                  src={course.thumbnailURL || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-24 h-24 text-primary/50" />
                </div>
              )}
            </motion.div>

            {/* Course Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-card border border-border rounded-xl p-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                <p className="text-lg text-muted-foreground mb-6">{course.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">{course.instructorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">{course.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">
                      {course.type === "batch" ? "Batch Course" : "Subject Course"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">Self-paced</span>
                  </div>
                </div>

                {course.type === "batch" && hasAccess && (
                  <div className="border-t border-border pt-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Course Subjects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {["Mathematics", "Physics", "Chemistry", "Biology", "English", "History"].map(
                        (subject, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{subject}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Course Features */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-xl font-semibold mb-4">What you'll learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Comprehensive course content",
                      "Expert instructor guidance",
                      "Practice exercises and materials",
                      "Lifetime access to course",
                      "Learn at your own pace",
                      "Certificate of completion",
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-6 sticky top-24"
            >
              {hasAccess ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-600 dark:text-green-400">You own this course</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your payment has been approved. Start learning now!
                    </p>
                  </div>
                  <button
                    onClick={handleWatchNow}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Continue Course
                  </button>
                </div>
              ) : hasPendingPayment ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">Payment Pending</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Your payment is awaiting admin approval. You'll get access once it's approved.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/payment-history")}
                    className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium"
                  >
                    View Payment Status
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b border-border">
                    <div className="text-4xl font-bold mb-2">
                      {course.price ? (
                        <>
                          ৳{course.price}
                        </>
                      ) : (
                        "Free"
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">One-time payment • Lifetime access</p>
                  </div>

                  <div className="space-y-3">
                    {isInCart ? (
                      <button
                        onClick={() => navigate("/checkout")}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Go to Checkout
                      </button>
                    ) : course.price === 0 || course.price === undefined ? (
                      <button
                        onClick={handleEnrollFree}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Enroll Free
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleBuyNow}
                          className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
                        >
                          Buy Now
                        </button>
                        <button
                          onClick={handleAddToCart}
                          className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Add to Cart
                        </button>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold mb-3">This course includes:</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-primary" />
                        Video lectures
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Study materials
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Lifetime access
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Certificate
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
