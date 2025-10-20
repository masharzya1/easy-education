"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, TrendingUp, Clock, Users, ArrowRight, ShoppingCart, Trash2, Check, Zap, BookOpen, Award, Infinity, Sparkles, GraduationCap, Star } from "lucide-react"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { enrollInFreeCourse } from "../lib/enrollment"
import { toast } from "../hooks/use-toast"

export default function Home() {
  const navigate = useNavigate()
  const { addToCart, openCart, cartItems, removeFromCart } = useCart()
  const { currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [trendingCourses, setTrendingCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasedCourses, setPurchasedCourses] = useState({})
  const [pendingCourses, setPendingCourses] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (currentUser) {
      checkPurchasedCourses()
      checkPendingCourses()
    }
  }, [currentUser, trendingCourses])

  const checkPurchasedCourses = async () => {
    if (!currentUser || trendingCourses.length === 0 || !db) return

    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "approved"),
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)

      const purchased = {}
      paymentsSnapshot.docs.forEach((doc) => {
        const payment = doc.data()
        payment.courses?.forEach((c) => {
          purchased[c.id] = true
        })
      })
      setPurchasedCourses(purchased)
    } catch (error) {
      console.error("[v0] Error checking purchased courses:", error)
    }
  }

  const checkPendingCourses = async () => {
    if (!currentUser || trendingCourses.length === 0 || !db) return

    try {
      const pendingQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "pending"),
      )
      const pendingSnapshot = await getDocs(pendingQuery)

      const pending = {}
      pendingSnapshot.docs.forEach((doc) => {
        const payment = doc.data()
        payment.courses?.forEach((c) => {
          pending[c.id] = true
        })
      })
      setPendingCourses(pending)
    } catch (error) {
      console.error("[v0] Error checking pending courses:", error)
    }
  }

  const fetchData = async () => {
    try {
      if (!db) {
        console.warn("[v0] Firebase not available, skipping data fetch")
        setLoading(false)
        return
      }

      const coursesQuery = query(collection(db, "courses"), orderBy("createdAt", "desc"), limit(6))
      const coursesSnapshot = await getDocs(coursesQuery)
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setTrendingCourses(coursesData)

      const categoriesQuery = query(collection(db, "categories"), limit(8))
      const categoriesSnapshot = await getDocs(categoriesQuery)
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCategories(categoriesData)
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      // Continue with empty data
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate("/courses", { state: { searchQuery: searchQuery.trim() } })
      setSearchQuery("")
    }
  }

  const handleAddToCart = (course, e) => {
    e.preventDefault()
    e.stopPropagation()
    const success = addToCart(course)
    if (success) {
      openCart()
    } else {
      toast({
        variant: "error",
        title: "Already in Cart",
        description: "This course is already in your cart!"
      })
    }
  }

  const handleRemoveFromCart = (course, e) => {
    e.preventDefault()
    e.stopPropagation()
    removeFromCart(course.id)
  }

  const handleEnrollFree = async (course, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentUser) {
      toast({
        variant: "error",
        title: "Login Required",
        description: "Please login to enroll in courses",
      })
      navigate("/login")
      return
    }

    const result = await enrollInFreeCourse(
      currentUser.uid,
      currentUser.email,
      currentUser.displayName || "User",
      course
    )

    if (result.success) {
      toast({
        variant: "success",
        title: "Enrolled Successfully!",
        description: result.message,
      })
      checkPurchasedCourses()
    } else {
      toast({
        variant: "error",
        title: "Enrollment Failed",
        description: result.message,
      })
    }
  }

  const handleCategoryClick = (category) => {
    navigate("/courses", { state: { categoryFilter: category.title } })
  }

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-background via-primary/5 to-secondary/10 py-28 md:py-40 px-4 overflow-hidden">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 -right-20 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 100, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -60, 0],
              y: [0, -80, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Floating decorative icons */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 md:left-20 opacity-20"
        >
          <BookOpen className="w-16 h-16 text-primary" />
        </motion.div>
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -10, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-40 right-10 md:right-32 opacity-20"
        >
          <GraduationCap className="w-20 h-20 text-secondary" />
        </motion.div>
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 15, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-32 left-16 md:left-40 opacity-20"
        >
          <Award className="w-14 h-14 text-primary" />
        </motion.div>
        <motion.div
          animate={{
            y: [0, 25, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 right-20 md:right-40 opacity-20"
        >
          <Sparkles className="w-12 h-12 text-secondary" />
        </motion.div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm rounded-full text-sm font-medium border border-primary/20">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-semibold">
                  #1 Premium Education Platform
                </span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-balance leading-[1.1] tracking-tight"
            >
              Transform Your Future with{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent animate-gradient">
                  World-Class Learning
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty leading-relaxed font-medium"
            >
              Access premium educational courses from expert instructors. Learn at your own pace with lifetime access to cutting-edge content.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSearch}
              className="max-w-3xl mx-auto mb-10"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70 group-hover:opacity-100"></div>
                <div className="relative flex items-center bg-card/80 backdrop-blur-xl border-2 border-border rounded-2xl overflow-hidden shadow-2xl hover:border-primary/60 hover:shadow-primary/10 transition-all duration-300 group-hover:scale-[1.02]">
                  <Search className="absolute left-6 w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for courses, subjects, or topics..."
                    className="w-full pl-16 pr-36 py-6 bg-transparent focus:outline-none text-base md:text-lg placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-8 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-xl transition-all font-semibold flex items-center gap-2 group/btn shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    Search
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4 mb-12"
            >
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 group"
              >
                <Sparkles className="w-5 h-5" />
                Explore Courses
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 md:gap-8"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-5 py-3 bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/50 transition-all cursor-default shadow-md"
              >
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">1000+ Courses</div>
                  <div className="text-xs text-muted-foreground">Premium content</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-5 py-3 bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/50 transition-all cursor-default shadow-md"
              >
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Expert Instructors</div>
                  <div className="text-xs text-muted-foreground">Industry leaders</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-5 py-3 bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/50 transition-all cursor-default shadow-md"
              >
                <div className="p-2 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-lg">
                  <Infinity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Lifetime Access</div>
                  <div className="text-xs text-muted-foreground">Learn anytime</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-3xl md:text-4xl font-serif font-bold">Browse by Category</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button onClick={() => handleCategoryClick(category)} className="w-full text-left">
                    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-lg transition-all group cursor-pointer">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                        {category.imageURL ? (
                          <img
                            src={category.imageURL || "/placeholder.svg"}
                            alt={category.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
                            <h3 className="text-center font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                              {category.title}
                            </h3>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Courses */}
      <section className="py-16 px-4 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold">Trending Courses</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                  <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : trendingCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/course/${course.id}`}>
                    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-lg transition-all group relative">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                        {course.thumbnailURL ? (
                          <img
                            src={course.thumbnailURL || "/placeholder.svg"}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-16 h-16 text-primary/50" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">{course.instructorName}</span>
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                            {course.category}
                          </span>
                        </div>
                        {purchasedCourses[course.id] ? (
                          <Link 
                            to={course.type === "batch" ? `/course/${course.id}/subjects` : `/course/${course.id}/chapters`} 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button className="w-full px-4 py-2 bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium hover:bg-green-500/30">
                              <Check className="w-4 h-4" />
                              Continue Course
                            </button>
                          </Link>
                        ) : pendingCourses[course.id] ? (
                          <div className="w-full px-4 py-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Payment Pending
                          </div>
                        ) : (!course.price || course.price === 0 || course.price === "0") ? (
                          <button
                            onClick={(e) => handleEnrollFree(course, e)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                          >
                            <Zap className="w-4 h-4" />
                            Enroll Free
                          </button>
                        ) : cartItems.some((item) => item.id === course.id) ? (
                          <button
                            onClick={(e) => handleRemoveFromCart(course, e)}
                            className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove from Cart
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(course, e)}
                            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No courses available yet. Check back soon!</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all font-medium group"
            >
              View All Courses
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
