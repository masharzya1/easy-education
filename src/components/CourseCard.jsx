"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, Users } from "lucide-react"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function CourseCard({ course, onAddToCart }) {
  const { addToCart, openCart } = useCart()
  const { currentUser } = useAuth()
  const [isPurchased, setIsPurchased] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkIfPurchased()
  }, [currentUser, course.id])

  const checkIfPurchased = async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "approved"),
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)

      const purchased = paymentsSnapshot.docs.some((doc) => {
        const payment = doc.data()
        return payment.courses?.some((c) => c.id === course.id)
      })

      setIsPurchased(purchased)
    } catch (error) {
      console.error("Error checking purchase status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const success = addToCart(course)
    if (success) {
      openCart()
    } else {
      alert("Course already in cart!")
    }
  }

  const truncateDescription = (text, maxLength = 20) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  return (
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
            {truncateDescription(course.description)}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{course.instructorName}</span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
              {course.category}
            </span>
          </div>

          {isPurchased ? (
            <button
              disabled
              className="w-full px-4 py-2 bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-default"
            >
              ✓ Already Purchased
            </button>
          ) : course.price === 0 || course.price === undefined ? (
            <Link to={`/course/${course.id}`} onClick={(e) => e.stopPropagation()}>
              <button className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                Enroll Free
              </button>
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
