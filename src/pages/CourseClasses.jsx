"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Play, ArrowLeft, Lock, Clock, User } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"

export default function CourseClasses() {
  const { courseId, subject, chapter } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuth()
  const [course, setCourse] = useState(null)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [courseId, subject, chapter])

  const fetchCourseData = async () => {
    try {
      const courseDoc = await getDoc(doc(db, "courses", courseId))
      if (courseDoc.exists()) {
        const courseData = { id: courseDoc.id, ...courseDoc.data() }
        setCourse(courseData)

        if (isAdmin) {
          setHasAccess(true)
        } else if (currentUser) {
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
        }

        // Fetch classes
        const classesQuery = query(collection(db, "classes"), where("courseId", "==", courseId))
        const classesSnapshot = await getDocs(classesQuery)
        let classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Filter by subject and chapter if provided
        if (subject) {
          classesData = classesData.filter((cls) => cls.subject === decodeURIComponent(subject))
        }
        if (chapter) {
          classesData = classesData.filter((cls) => cls.chapter === decodeURIComponent(chapter))
        }

        classesData.sort((a, b) => a.order - b.order)
        setClasses(classesData)
      }
    } catch (error) {
      console.error("Error fetching course data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAccess && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">You need to purchase this course to watch the videos.</p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
          >
            Purchase Course
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (subject && course?.type === "batch") {
                navigate(`/course/${courseId}/subjects/${subject}/chapters`)
              } else {
                navigate(`/course/${courseId}/chapters`)
              }
            }}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {subject ? "Back to Chapters" : "Back to Chapters"}
          </button>
          <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
          <p className="text-muted-foreground">
            {chapter && `Chapter: ${decodeURIComponent(chapter)}`}
            {subject && ` • Subject: ${decodeURIComponent(subject)}`}
          </p>
        </div>

        {/* Classes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls, index) => (
            <motion.button
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/course/${courseId}/watch/${cls.id}`)}
              className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Play className="w-6 h-6 text-primary fill-current" />
                </div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {cls.title}
                </h3>

                {cls.teacherName && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="truncate">{cls.teacherName}</span>
                  </div>
                )}

                {cls.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{cls.duration}</span>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No classes found for this selection.</p>
          </div>
        )}
      </div>
    </div>
  )
}
