"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, TrendingUp, Clock, Users, ArrowRight, ShoppingCart, Trash2, Check } from "lucide-react"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"

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
      alert("Course already in cart!")
    }
  }

  const handleRemoveFromCart = (course, e) => {
    e.preventDefault()
    e.stopPropagation()
    removeFromCart(course.id)
  }

  const handleCategoryClick = (category) => {
    navigate("/courses", { state: { categoryFilter: category.title } })
  }

  return (
    <div className="min-h-screen">
      <section className="relative bg-background py-24 md:py-32 px-4 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-serif font-bold mb-6 text-balance leading-tight"
            >
              Master new skills, <span className="text-primary">invest in yourself</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty leading-relaxed"
            >
              Access premium educational courses from expert instructors. Learn at your own pace with lifetime access.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-colors"></div>
                <div className="relative flex items-center bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg hover:border-primary/50 transition-all">
                  <Search className="absolute left-6 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for courses, subjects, or topics..."
                    className="w-full pl-14 pr-32 py-5 bg-transparent focus:outline-none text-base"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all font-medium flex items-center gap-2 group/btn"
                  >
                    Search
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Premium courses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>Expert instructors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Lifetime access</span>
              </div>
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
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">{course.instructorName}</span>
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                            {course.category}
                          </span>
                        </div>
                        {purchasedCourses[course.id] ? (
                          <Link to={`/course/${course.id}/chapters`} onClick={(e) => e.stopPropagation()}>
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
