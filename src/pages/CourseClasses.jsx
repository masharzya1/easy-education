"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Play, ArrowLeft, Lock, Clock, User, Archive } from "lucide-react"
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

  const isArchive = subject && decodeURIComponent(subject) === "archive"

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

        const classesQuery = query(collection(db, "classes"), where("courseId", "==", courseId))
        const classesSnapshot = await getDocs(classesQuery)
        let classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        if (subject) {
          const decodedSubject = decodeURIComponent(subject)
          classesData = classesData.filter((cls) => {
            if (Array.isArray(cls.subject)) {
              return cls.subject.includes(decodedSubject)
            }
            return cls.subject === decodedSubject
          })
        }
        if (chapter) {
          const decodedChapter = decodeURIComponent(chapter)
          classesData = classesData.filter((cls) => {
            if (Array.isArray(cls.chapter)) {
              return cls.chapter.includes(decodedChapter)
            }
            return cls.chapter === decodedChapter
          })
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
        <div className="mb-8">
          <button
            onClick={() => {
              if (subject && course?.type === "batch") {
                navigate(`/course/${courseId}/subjects/${subject}/chapters`)
              } else if (subject && !course?.type) {
                navigate(`/course/${courseId}/subjects/${subject}/chapters`)
              } else if (!subject) {
                navigate(`/course/${courseId}/chapters`)
              } else {
                navigate(`/course/${courseId}/subjects`)
              }
            }}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Chapters
          </button>
          <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
          <div className="text-muted-foreground">
            {isArchive && (
              <div className="flex items-center gap-2 mb-1">
                <Archive className="w-4 h-4 text-orange-500" />
                <span className="text-orange-600 font-medium">Archive</span>
              </div>
            )}
            <div>
              {chapter && `Chapter: ${decodeURIComponent(chapter)}`}
              {subject && !isArchive && ` • Subject: ${decodeURIComponent(subject)}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls, index) => (
            <motion.button
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/course/${courseId}/watch/${cls.id}`)}
              className={`group relative bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 text-left ${
                isArchive 
                  ? "border-orange-500/20 hover:border-orange-500/40" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${
                isArchive 
                  ? "from-orange-500/5 to-amber-500/5" 
                  : "from-primary/5 to-secondary/5"
              }`} />
              <div className="relative p-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                  isArchive 
                    ? "bg-orange-500/10 group-hover:bg-orange-500/20" 
                    : "bg-primary/10 group-hover:bg-primary/20"
                }`}>
                  <Play className={`w-6 h-6 fill-current ${isArchive ? "text-orange-500" : "text-primary"}`} />
                </div>
                <h3 className={`text-lg font-bold mb-3 line-clamp-2 transition-colors ${
                  isArchive 
                    ? "text-orange-600 group-hover:text-orange-500" 
                    : "group-hover:text-primary"
                }`}>
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
            <p className="text-muted-foreground text-lg">
              No classes found {isArchive ? "in this archived chapter" : "for this selection"}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
