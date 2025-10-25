"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { FileQuestion, Clock, Award, ArrowLeft, Lock, CheckCircle, Archive, Trophy, Zap } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import { useExam } from "../contexts/ExamContext"

export default function ExamList() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuth()
  const { getActiveExamsByCourse, getArchivedExamsByCourse, getExamResult } = useExam()
  const [course, setCourse] = useState(null)
  const [activeExams, setActiveExams] = useState([])
  const [archivedExams, setArchivedExams] = useState([])
  const [examResults, setExamResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [activeTab, setActiveTab] = useState("active")

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    try {
      setLoading(true)

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
      }

      const activeExamsData = await getActiveExamsByCourse(courseId)
      setActiveExams(activeExamsData)

      const archivedExamsData = await getArchivedExamsByCourse(courseId)
      setArchivedExams(archivedExamsData)

      if (currentUser) {
        const allExams = [...activeExamsData, ...archivedExamsData]
        const results = {}
        for (const exam of allExams) {
          const result = await getExamResult(currentUser.uid, exam.id)
          if (result) {
            results[exam.id] = result
          }
        }
        setExamResults(results)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black"></div>
      </div>
    )
  }

  if (!hasAccess && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-white">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-gray-900" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Access Restricted</h2>
          <p className="text-gray-600 mb-8">You need to purchase this course to access exams.</p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="w-full px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors"
          >
            Purchase Course
          </button>
        </div>
      </div>
    )
  }

  const currentExams = activeTab === "active" ? activeExams : archivedExams

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{course?.title}</h1>
            <p className="text-gray-600">Prepare and test your knowledge with our comprehensive exams</p>
          </div>
        </div>

        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("active")}
              className={`pb-4 font-medium transition-colors relative ${
                activeTab === "active" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4" />
                Active Exams
                {activeExams.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded-full font-medium">
                    {activeExams.length}
                  </span>
                )}
              </div>
              {activeTab === "active" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
            </button>

            <button
              onClick={() => setActiveTab("archived")}
              className={`pb-4 font-medium transition-colors relative ${
                activeTab === "archived" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archived Exams
                {archivedExams.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded-full font-medium">
                    {archivedExams.length}
                  </span>
                )}
              </div>
              {activeTab === "archived" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
            </button>
          </div>
        </div>

        {currentExams.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {activeTab === "active" ? (
                <FileQuestion className="w-8 h-8 text-gray-400" />
              ) : (
                <Archive className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <p className="text-gray-600 text-lg">
              {activeTab === "active"
                ? "No active exams available for this course yet."
                : "No archived exams for this course."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentExams.map((exam, index) => {
              const result = examResults[exam.id]
              const hasAttempted = !!result
              const isPassed = result && result.score >= exam.passingScore

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                    {exam.isArchived && (
                      <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                        <Archive className="w-3 h-3" />
                        Archived
                      </div>
                    )}
                    {hasAttempted && (
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          isPassed ? "text-green-700 bg-green-100" : "text-orange-700 bg-orange-100"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {isPassed ? "Passed" : "Attempted"}
                      </div>
                    )}
                  </div>

                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <Zap className="w-5 h-5 text-gray-900" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                    {exam.title}
                  </h3>
                  {exam.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{exam.description}</p>}

                  <div className="space-y-2 mb-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{exam.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>Pass: {exam.passingScore}%</span>
                    </div>
                  </div>

                  {hasAttempted ? (
                    <div className="space-y-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600">Your Score</span>
                          <span className={`text-2xl font-bold ${isPassed ? "text-green-700" : "text-orange-700"}`}>
                            {result.score}%
                          </span>
                        </div>
                        <p className={`text-xs font-medium ${isPassed ? "text-green-700" : "text-orange-700"}`}>
                          {isPassed ? "Passed!" : "Keep practicing!"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/exam/${exam.id}/leaderboard`}
                          className="px-3 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium text-xs flex items-center justify-center gap-1"
                        >
                          <Trophy className="w-3 h-3" />
                          Leaderboard
                        </Link>
                        <Link
                          to={`/exam/${exam.id}/solutions`}
                          className="px-3 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium text-xs flex items-center justify-center gap-1"
                        >
                          <FileQuestion className="w-3 h-3" />
                          Solutions
                        </Link>
                        <Link
                          to={`/exam/${exam.id}/attempts`}
                          className="px-3 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium text-xs flex items-center justify-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          My Attempts
                        </Link>
                        <Link
                          to={`/exam/${exam.id}`}
                          className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-center font-medium text-xs flex items-center justify-center gap-1"
                        >
                          Retake
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to={`/exam/${exam.id}`}
                      className="block w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-center font-medium"
                    >
                      Start Exam
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
