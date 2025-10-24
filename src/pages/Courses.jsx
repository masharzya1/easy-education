"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Filter, BookOpen, ShoppingCart, Trash2, Check, Clock, Zap } from "lucide-react"
import { collection, query, orderBy, getDocs, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { enrollInFreeCourse } from "../lib/enrollment"
import { toast } from "../hooks/use-toast"

export default function Courses() {
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart, openCart, cartItems, removeFromCart } = useCart()
  const { currentUser, isAdmin } = useAuth()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [purchasedCourses, setPurchasedCourses] = useState({})
  const [pendingCourses, setPendingCourses] = useState({})

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery)
    }
    if (location.state?.categoryFilter) {
      setCategoryFilter(location.state.categoryFilter)
    }
  }, [location.state])

  useEffect(() => {
    fetchCourses()
  }, [isAdmin])

  useEffect(() => {
    if (currentUser) {
      checkPurchasedCourses()
      checkPendingCourses()
    }
  }, [currentUser, courses])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchQuery, categoryFilter, sortBy])

  const checkPurchasedCourses = async () => {
    if (!currentUser || courses.length === 0) return

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
      console.error("Error checking purchased courses:", error)
    }
  }

  const checkPendingCourses = async () => {
    if (!currentUser || courses.length === 0) return

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
      console.error("Error checking pending courses:", error)
    }
  }

  const fetchCourses = async () => {
    try {
      const coursesQuery = query(collection(db, "courses"), orderBy("createdAt", "desc"))
      const coursesSnapshot = await getDocs(coursesQuery)
      let coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      // Filter out draft courses for non-admin users
      if (!isAdmin) {
        coursesData = coursesData.filter(course => course.publishStatus !== "draft")
      }
      
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCourses = () => {
    let filtered = courses ? [...courses] : []

    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.category?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((course) => course.category === categoryFilter)
    }

    if (sortBy === "newest") {
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
    } else if (sortBy === "title") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    setFilteredCourses(filtered)
  }

  const categories = ["all", ...new Set(courses.map((c) => c.category).filter(Boolean))]

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

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore Courses</h1>
          <p className="text-base md:text-lg text-muted-foreground">Discover our collection of educational courses</p>
        </motion.div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-foreground">Search Courses</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, instructor, or description..."
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm smooth-transition"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Category</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm appearance-none smooth-transition"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <span className="text-sm font-medium text-foreground">Sort by:</span>
            <div className="flex flex-wrap gap-2">
              {["newest", "oldest", "title"].map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium smooth-transition ${
                    sortBy === option
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                <div className="h-5 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/course/${course.id}`}>
                  <div className="bg-card border border-border rounded-lg overflow-hidden card-hover h-full flex flex-col">
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
                      {course.thumbnailURL ? (
                        <img
                          src={course.thumbnailURL || "/placeholder.svg"}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 smooth-transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      {course.status && (
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                            course.status === "running" 
                              ? "bg-green-500 text-white" 
                              : course.status === "ongoing" 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-500 text-white"
                          }`}>
                            {course.status}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-base mb-3 line-clamp-2 text-foreground">{course.title}</h3>
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                        <span className="text-xs text-muted-foreground">{course.instructorName}</span>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                          {course.category}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-muted-foreground">
                          {course.type === "subject" ? "Subject Course" : "Batch Course"}
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
                          className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg smooth-transition flex items-center justify-center gap-2 text-sm font-medium active:scale-95"
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
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
