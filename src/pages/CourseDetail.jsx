"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ShoppingCart, Play, BookOpen, Clock, Users, Tag, Check, AlertCircle } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { isFirebaseId } from "../lib/slug"

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
  const [teachers, setTeachers] = useState([])

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
      let courseData = null
      
      if (isFirebaseId(courseId)) {
        const courseDoc = await getDoc(doc(db, "courses", courseId))
        if (courseDoc.exists()) {
          courseData = { id: courseDoc.id, ...courseDoc.data() }
        }
      } else {
        const q = query(collection(db, "courses"), where("slug", "==", courseId))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          const courseDoc = snapshot.docs[0]
          courseData = { id: courseDoc.id, ...courseDoc.data() }
        }
      }
      
      if (courseData) {
        setCourse(courseData)

        if (courseData.instructors && courseData.instructors.length > 0) {
          const teachersQuery = query(
            collection(db, "teachers"),
            where("name", "in", courseData.instructors.slice(0, 10))
          )
          const teachersSnapshot = await getDocs(teachersQuery)
          const teachersData = teachersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setTeachers(teachersData)
        }

        if (currentUser) {
          const paymentsQuery = query(
            collection(db, "payments"),
            where("userId", "==", currentUser.uid),
            where("status", "==", "approved"),
          )
          const paymentsSnapshot = await getDocs(paymentsQuery)

          const hasApprovedCourse = paymentsSnapshot.docs.some((doc) => {
            const payment = doc.data()
            return payment.courses?.some((c) => c.id === courseData.id)
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
            return payment.courses?.some((c) => c.id === courseData.id)
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
      navigate(`/course/${course.id}/subjects`)
    } else {
      navigate(`/course/${course.id}/chapters`)
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
                <p className="text-base text-muted-foreground mb-6">{course.description}</p>

                {/* Teachers Section */}
                {teachers.length > 0 && (
                  <div className="border-t border-border pt-6">
                    <h3 className="text-xl font-semibold mb-4">Course Instructors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {teacher.imageURL ? (
                              <img
                                src={teacher.imageURL}
                                alt={teacher.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-0.5">{teacher.name}</h4>
                            {teacher.bio && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{teacher.bio}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
