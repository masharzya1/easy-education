"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { BookOpen, ArrowLeft, Lock, Archive } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"

export default function CourseChapters() {
  const { courseId, subject } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, isAdmin } = useAuth()
  const [course, setCourse] = useState(null)
  const [chapters, setChapters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  const isArchiveRoot = subject && decodeURIComponent(subject) === "archive"
  const isArchiveSubject = location.pathname.includes("/archive/")
  const isArchive = isArchiveRoot || isArchiveSubject

  useEffect(() => {
    fetchCourseData()
  }, [courseId, subject])

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

        const isClassArchived = (cls) => {
          if (cls.isArchived === true) return true
          const subjectIsArchive = Array.isArray(cls.subject) ? cls.subject.includes("archive") : cls.subject === "archive"
          const chapterIsArchive = Array.isArray(cls.chapter) ? cls.chapter.includes("archive") : cls.chapter === "archive"
          return subjectIsArchive || chapterIsArchive
        }

        if (isArchiveRoot) {
          classesData = classesData.filter((cls) => isClassArchived(cls))
          
          const archivedSubjects = []
          classesData.forEach((cls) => {
            if (Array.isArray(cls.subject)) {
              cls.subject.forEach(s => {
                if (s && s !== "archive") archivedSubjects.push(s)
              })
            } else if (cls.subject && cls.subject !== "archive") {
              archivedSubjects.push(cls.subject)
            }
          })
          const uniqueSubjects = [...new Set(archivedSubjects)].sort()
          setSubjects(uniqueSubjects)
          setChapters([])
        } else if (isArchiveSubject && subject) {
          const decodedSubject = decodeURIComponent(subject)
          classesData = classesData.filter((cls) => {
            if (!isClassArchived(cls)) return false
            if (Array.isArray(cls.subject)) {
              return cls.subject.includes(decodedSubject)
            }
            return cls.subject === decodedSubject
          })
          
          const allChapters = []
          classesData.forEach((cls) => {
            if (Array.isArray(cls.chapter)) {
              allChapters.push(...cls.chapter)
            } else {
              allChapters.push(cls.chapter || "General")
            }
          })
          const uniqueChapters = [...new Set(allChapters)].sort()
          setChapters(uniqueChapters)
          setSubjects([])
        } else if (subject) {
          const decodedSubject = decodeURIComponent(subject)
          classesData = classesData.filter((cls) => {
            if (isClassArchived(cls)) return false
            if (Array.isArray(cls.subject)) {
              return cls.subject.includes(decodedSubject)
            }
            return cls.subject === decodedSubject
          })
          
          const allChapters = []
          classesData.forEach((cls) => {
            if (Array.isArray(cls.chapter)) {
              allChapters.push(...cls.chapter)
            } else {
              allChapters.push(cls.chapter || "General")
            }
          })
          const uniqueChapters = [...new Set(allChapters)].sort()
          setChapters(uniqueChapters)
          setSubjects([])
        } else {
          classesData = classesData.filter((cls) => !isClassArchived(cls))
          
          const allChapters = []
          classesData.forEach((cls) => {
            if (Array.isArray(cls.chapter)) {
              allChapters.push(...cls.chapter)
            } else {
              allChapters.push(cls.chapter || "General")
            }
          })
          const uniqueChapters = [...new Set(allChapters)].sort()
          setChapters(uniqueChapters)
          setSubjects([])
        }
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
              if (isArchiveSubject && subject && !isArchiveRoot) {
                navigate(`/course/${courseId}/subjects/archive/chapters`)
              } else if (subject) {
                navigate(`/course/${courseId}/subjects`)
              } else {
                navigate(`/course/${courseId}`)
              }
            }}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {isArchiveSubject && !isArchiveRoot ? "Back to Archive Subjects" : subject ? "Back to Subjects" : "Back to Course"}
          </button>
          <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
          <p className="text-muted-foreground">
            {isArchive ? (
              <span className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-orange-500" />
                Archive
              </span>
            ) : subject ? (
              `Subject: ${decodeURIComponent(subject)} - Select a chapter`
            ) : (
              "Select a chapter to view classes"
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isArchive && subjects.length > 0 ? (
            subjects.map((archiveSubject, index) => (
              <motion.button
                key={archiveSubject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  navigate(`/course/${courseId}/archive/${encodeURIComponent(archiveSubject)}/chapters`)
                }}
                className="group relative bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/50 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <BookOpen className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-orange-600 group-hover:text-orange-500 transition-colors">{archiveSubject}</h3>
                  <p className="text-sm text-muted-foreground">Click to view archived chapters</p>
                </div>
              </motion.button>
            ))
          ) : (
            chapters.map((chapter, index) => (
              <motion.button
                key={chapter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  if (isArchiveSubject && subject) {
                    navigate(`/course/${courseId}/archive/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}/classes`)
                  } else if (subject) {
                    navigate(`/course/${courseId}/classes/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}`)
                  } else {
                    navigate(`/course/${courseId}/classes/${encodeURIComponent(chapter)}`)
                  }
                }}
                className={`group relative bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-300 text-left ${
                  isArchiveSubject 
                    ? "border-orange-500/30 hover:border-orange-500/50" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                  isArchiveSubject 
                    ? "from-orange-500/5 to-amber-500/5" 
                    : "from-primary/5 to-secondary/5"
                }`} />
                <div className="relative">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                    isArchiveSubject 
                      ? "bg-orange-500/10 group-hover:bg-orange-500/20" 
                      : "bg-primary/10 group-hover:bg-primary/20"
                  }`}>
                    <BookOpen className={`w-6 h-6 ${isArchiveSubject ? "text-orange-500" : "text-primary"}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 transition-colors ${
                    isArchiveSubject 
                      ? "text-orange-600 group-hover:text-orange-500" 
                      : "group-hover:text-primary"
                  }`}>
                    {chapter}
                  </h3>
                  <p className="text-sm text-muted-foreground">Click to view classes</p>
                </div>
              </motion.button>
            ))
          )}
        </div>

      
        
        {!isArchive && chapters.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No chapters available {subject ? "for this subject" : ""} yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
