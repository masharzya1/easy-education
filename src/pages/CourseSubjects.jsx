"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { BookOpen, ArrowLeft, Lock, Archive, FileQuestion, Send, CheckCircle2 } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import { useExam } from "../contexts/ExamContext"
import { toast as showGlobalToast } from "../hooks/use-toast"

export default function CourseSubjects() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuth()
  const { getExamsByCourse } = useExam()
  const [course, setCourse] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [hasArchive, setHasArchive] = useState(false)
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [telegramId, setTelegramId] = useState("")
  const [telegramMobile, setTelegramMobile] = useState("")
  const [telegramSubmitted, setTelegramSubmitted] = useState(false)
  const [submittingTelegram, setSubmittingTelegram] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  useEffect(() => {
    if (currentUser && courseId) {
      checkTelegramSubmission()
    }
  }, [currentUser, courseId])

  const checkTelegramSubmission = async () => {
    if (!currentUser || !courseId) return
    
    try {
      const submissionQuery = query(
        collection(db, "telegramSubmissions"),
        where("userId", "==", currentUser.uid),
        where("courseId", "==", courseId)
      )
      const submissionSnapshot = await getDocs(submissionQuery)
      setTelegramSubmitted(!submissionSnapshot.empty)
    } catch (error) {
      console.error("Error checking telegram submission:", error)
    }
  }

  const handleTelegramSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser || !telegramId.trim() || !telegramMobile.trim() || telegramSubmitted) return

    setSubmittingTelegram(true)

    try {
      await addDoc(collection(db, "telegramSubmissions"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userEmail: currentUser.email,
        telegramId: telegramId.trim(),
        telegramMobile: telegramMobile.trim(),
        courseId: courseId,
        courseName: course?.title || "",
        submittedAt: serverTimestamp()
      })

      setTelegramSubmitted(true)
      setTelegramId("")
      setTelegramMobile("")
      showGlobalToast({
        title: "Success!",
        description: "Telegram information submitted successfully!",
      })
    } catch (error) {
      console.error("Error submitting telegram info:", error)
      showGlobalToast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit. Please try again.",
      })
    } finally {
      setSubmittingTelegram(false)
    }
  }

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
        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const isClassArchived = (cls) => {
          if (cls.isArchived === true) return true
          const subjectIsArchive = Array.isArray(cls.subject)
            ? cls.subject.includes("archive")
            : cls.subject === "archive"
          const chapterIsArchive = Array.isArray(cls.chapter)
            ? cls.chapter.includes("archive")
            : cls.chapter === "archive"
          return subjectIsArchive || chapterIsArchive
        }

        const regularSubjects = []
        classesData
          .filter((cls) => !isClassArchived(cls) && cls.subject)
          .forEach((cls) => {
            if (Array.isArray(cls.subject)) {
              cls.subject.forEach((s) => {
                if (s && s !== "archive") regularSubjects.push(s)
              })
            } else if (cls.subject !== "archive") {
              regularSubjects.push(cls.subject)
            }
          })
        const uniqueSubjects = [...new Set(regularSubjects)].sort()
        setSubjects(uniqueSubjects)

        const archiveClasses = classesData.filter((cls) => isClassArchived(cls))
        setHasArchive(archiveClasses.length > 0)

        const examsData = await getExamsByCourse(courseId)
        setExams(examsData)
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
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Course
          </button>
          <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
          <p className="text-muted-foreground">Select a subject to view chapters</p>
        </div>

        {/* Telegram Join Section */}
        {course?.telegramLink && (
          <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 shadow-lg">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Join Telegram Community
              </span>
            </h2>
            
            <p className="text-sm text-muted-foreground mb-4">
              Join our Telegram group to get updates, interact with instructors, and connect with fellow students.
            </p>

            <a
              href={course.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full md:w-auto md:inline-block py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-medium text-center mb-6 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                <span>Join Telegram Group</span>
              </div>
            </a>

            <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
              <h3 className="font-semibold mb-3 text-sm">Submit Your Telegram Information</h3>
              
              {telegramSubmitted ? (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300 text-sm mb-1">
                      Information Submitted
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      You have already submitted your Telegram information for this course.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleTelegramSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Webapp Account Name
                      </label>
                      <input
                        type="text"
                        value={currentUser?.displayName || currentUser?.email || ""}
                        disabled
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Webapp Account Gmail
                      </label>
                      <input
                        type="email"
                        value={currentUser?.email || ""}
                        disabled
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        তোমার টেলিগ্রাম আইডির নাম লিখো [যেই আইডি থেকে রিকুয়েস্ট পাঠানো হয়েছে]
                      </label>
                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        placeholder="Example: Shakib"
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={telegramMobile}
                        onChange={(e) => setTelegramMobile(e.target.value)}
                        placeholder="01912345678"
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTelegram || !telegramId.trim() || !telegramMobile.trim()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {submittingTelegram ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Information</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              onClick={() => navigate(`/course/${courseId}/exams`)}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <FileQuestion className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Exams</h3>
                <p className="text-sm text-muted-foreground">
                  {exams.length} exam{exams.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </motion.button>
          )}

          {subjects.map((subject, index) => (
            <motion.button
              key={subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + (exams.length > 0 ? 1 : 0)) * 0.1 }}
              onClick={() => {
                navigate(`/course/${courseId}/subjects/${encodeURIComponent(subject)}/chapters`)
              }}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{subject}</h3>
                <p className="text-sm text-muted-foreground">Click to view chapters</p>
              </div>
            </motion.button>
          ))}

          {hasArchive && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (subjects.length + (exams.length > 0 ? 1 : 0)) * 0.1 }}
              onClick={() => {
                navigate(`/course/${courseId}/subjects/archive/chapters`)
              }}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Archive className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Archive</h3>
                <p className="text-sm text-muted-foreground">Archived classes from previous batches</p>
              </div>
            </motion.button>
          )}
        </div>

        {subjects.length === 0 && !hasArchive && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No subjects or archived classes available for this course yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
