import { useState, useEffect, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { TrendingUp, Award, FileQuestion, CheckCircle, XCircle, Clock, BookOpen, ArrowLeft, AlertCircle } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import { useExam } from "../contexts/ExamContext"

export default function Analytics() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { getUserExamResults } = useExam()
  const [examResults, setExamResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState(null)

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }
    fetchResults()
  }, [currentUser])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const results = await getUserExamResults(currentUser.uid)
      
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          const examDoc = await getDoc(doc(db, "exams", result.examId))
          if (examDoc.exists()) {
            const examData = examDoc.data()
            const courseDoc = await getDoc(doc(db, "courses", examData.courseId))
            return {
              ...result,
              examTitle: examData.title,
              examDuration: examData.duration,
              passingScore: examData.passingScore,
              courseName: courseDoc.exists() ? courseDoc.data().title : "Unknown Course"
            }
          }
          return result
        })
      )

      enrichedResults.sort((a, b) => {
        const aTime = a.submittedAt?.seconds || 0
        const bTime = b.submittedAt?.seconds || 0
        return bTime - aTime
      })

      setExamResults(enrichedResults)
    } catch (error) {
      console.error("Error fetching exam results:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    if (examResults.length === 0) {
      return { totalExams: 0, averageScore: 0, passedExams: 0, passRate: 0 }
    }

    const totalExams = examResults.length
    const totalScore = examResults.reduce((sum, result) => sum + (result.score || 0), 0)
    const averageScore = totalScore / totalExams
    const passedExams = examResults.filter(result => result.score >= (result.passingScore || 70)).length
    const passRate = (passedExams / totalExams) * 100

    return { 
      totalExams, 
      averageScore: Math.round(averageScore), 
      passedExams, 
      passRate: Math.round(passRate) 
    }
  }, [examResults])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mb-2">Exam Analytics</h1>
          <p className="text-muted-foreground">Track your exam performance and see areas for improvement</p>
        </div>

        {examResults.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <FileQuestion className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">You haven't taken any exams yet.</p>
            <Link
              to="/courses"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <FileQuestion className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Exams</p>
                    <p className="text-2xl font-bold">{stats.totalExams}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{stats.averageScore}%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Passed Exams</p>
                    <p className="text-2xl font-bold">{stats.passedExams}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                    <p className="text-2xl font-bold">{stats.passRate}%</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold">Exam History</h2>
                {examResults.map((result, index) => {
                  const passed = result.score >= (result.passingScore || 70)
                  const submittedDate = result.submittedAt?.toDate?.() || new Date()
                  const hasCQAnswers = result.cqAnswers && result.cqAnswers.length > 0
                  const cqPending = hasCQAnswers && !result.cqGraded

                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{result.examTitle || "Untitled Exam"}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{result.courseName}</span>
                          </div>
                          {cqPending && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>অপেক্ষমাণ / CQ Grading Pending</span>
                            </div>
                          )}
                          {hasCQAnswers && result.cqGraded && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-700 dark:text-blue-400 text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>CQ Graded: {result.cqScore?.toFixed(1) || 0}%</span>
                            </div>
                          )}
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${
                          passed ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                        }`}>
                          <div className="text-2xl font-bold">{result.score}%</div>
                          <div className="text-xs">{cqPending ? "MCQ Only" : passed ? "Passed" : "Failed"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{result.examDuration || "N/A"} mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>{result.totalQuestions - (result.wrongAnswers?.length || 0)} / {result.totalQuestions} correct</span>
                        </div>
                        <div className="ml-auto">
                          {submittedDate.toLocaleDateString()}
                        </div>
                      </div>

                      {selectedResult?.id === result.id && result.wrongAnswers && result.wrongAnswers.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-4 border-t border-border"
                        >
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            Mistakes ({result.wrongAnswers.length})
                          </h4>
                          <div className="space-y-3">
                            {result.wrongAnswers.map((mistake, idx) => (
                              <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                <p className="font-medium mb-2">{mistake.questionText}</p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-red-600">Your answer: {mistake.options?.[mistake.userAnswer] || "Not answered"}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600">Correct answer: {mistake.options?.[mistake.correctAnswer] || "N/A"}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Quick Stats</h2>
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Performance Breakdown</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Passed</span>
                        <span className="font-medium">{stats.passedExams}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${stats.passRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Failed</span>
                        <span className="font-medium">{stats.totalExams - stats.passedExams}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all"
                          style={{ width: `${100 - stats.passRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Keep Going!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You're making great progress. Keep practicing to improve your scores!
                  </p>
                  <Link
                    to="/courses"
                    className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
                  >
                    Browse Courses
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
