import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { FileQuestion, Clock, Award, ArrowLeft, BookOpen, Lock, CheckCircle } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import { useExam } from "../contexts/ExamContext"

export default function ExamList() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuth()
  const { getExamsByCourse, getExamResult } = useExam()
  const [course, setCourse] = useState(null)
  const [exams, setExams] = useState([])
  const [examResults, setExamResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

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
            where("status", "==", "approved")
          )
          const paymentsSnapshot = await getDocs(paymentsQuery)
          const hasApprovedCourse = paymentsSnapshot.docs.some((doc) => {
            const payment = doc.data()
            return payment.courses?.some((c) => c.id === courseId)
          })
          setHasAccess(hasApprovedCourse)
        }
      }

      const examsData = await getExamsByCourse(courseId)
      setExams(examsData)

      if (currentUser) {
        const results = {}
        for (const exam of examsData) {
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
          <p className="text-muted-foreground mb-6">You need to purchase this course to access exams.</p>
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
          <h1 className="text-3xl font-bold mb-2">Exams - {course?.title}</h1>
          <p className="text-muted-foreground">View and take exams for this course</p>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <FileQuestion className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No exams available for this course yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam, index) => {
              const result = examResults[exam.id]
              const hasAttempted = !!result

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  {hasAttempted && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 bg-green-500/10 px-2 py-1 rounded text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  )}

                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <FileQuestion className="w-6 h-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground mb-4">{exam.description}</p>
                  )}

                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
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
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Your Score:</span>
                        <span className={`text-xl font-bold ${
                          result.score >= exam.passingScore ? "text-green-600" : "text-red-600"
                        }`}>
                          {result.score}%
                        </span>
                      </div>
                      {result.score >= exam.passingScore ? (
                        <p className="text-sm text-green-600 mt-1">🎉 Passed!</p>
                      ) : (
                        <p className="text-sm text-red-600 mt-1">Keep practicing!</p>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={`/exam/${exam.id}`}
                      className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
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
