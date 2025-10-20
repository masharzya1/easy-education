import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, Send, AlertCircle, Image as ImageIcon } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useExam } from "../contexts/ExamContext"
import { toast } from "../hooks/use-toast"

export default function ExamView() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { getExamById, getQuestionsByExam, submitExamResult, getExamResult } = useExam()

  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }
    fetchExamData()
  }, [examId, currentUser])

  const fetchExamData = async () => {
    try {
      setLoading(true)
      
      const existingResult = await getExamResult(currentUser.uid, examId)
      if (existingResult) {
        toast({
          title: "Already Attempted",
          description: "You have already completed this exam",
        })
        navigate(-1)
        return
      }

      const examData = await getExamById(examId)
      if (!examData) {
        toast({
          variant: "error",
          title: "Error",
          description: "Exam not found",
        })
        navigate(-1)
        return
      }

      const questionsData = await getQuestionsByExam(examId)
      if (questionsData.length === 0) {
        toast({
          variant: "error",
          title: "No Questions",
          description: "This exam has no questions yet",
        })
        navigate(-1)
        return
      }

      setExam(examData)
      setQuestions(questionsData)
      setTimeLeft(examData.duration * 60)
    } catch (error) {
      console.error("Error fetching exam:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to load exam",
      })
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasStarted, timeLeft])

  const startExam = () => {
    setHasStarted(true)
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    })
  }

  const calculateScore = () => {
    let totalMarks = 0
    let earnedMarks = 0

    questions.forEach((question) => {
      totalMarks += question.marks || 1
      if (question.type === "mcq") {
        if (answers[question.id] === question.correctAnswer) {
          earnedMarks += question.marks || 1
        }
      }
    })

    return totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0
  }

  const handleSubmit = async () => {
    if (!hasStarted) return

    const answeredCount = Object.keys(answers).length
    const mcqCount = questions.filter(q => q.type === "mcq").length

    if (answeredCount < mcqCount) {
      const proceed = confirm(
        `You have only answered ${answeredCount} out of ${mcqCount} MCQ questions. Do you want to submit anyway?`
      )
      if (!proceed) return
    }

    setSubmitting(true)

    try {
      const score = calculateScore()
      await submitExamResult(currentUser.uid, examId, answers, score)

      toast({
        title: "Exam Submitted!",
        description: `You scored ${score}%`,
      })

      navigate(-1)
    } catch (error) {
      console.error("Error submitting exam:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to submit exam",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-8 max-w-2xl w-full"
        >
          <h1 className="text-3xl font-bold mb-4">{exam.title}</h1>
          {exam.description && (
            <p className="text-muted-foreground mb-6">{exam.description}</p>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span>Duration: {exam.duration} minutes</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              <span>Total Questions: {questions.length}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              <span>Passing Score: {exam.passingScore}%</span>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Important:</strong> Once you start the exam, the timer will begin. You can only attempt this exam once.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium"
            >
              Go Back
            </button>
            <button
              onClick={startExam}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium"
            >
              Start Exam
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft < 300 ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary"
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  {question.questionText && (
                    <p className="text-base mb-2">{question.questionText}</p>
                  )}
                  {question.questionImageUrl && (
                    <img
                      src={question.questionImageUrl}
                      alt="Question"
                      className="max-w-full rounded-lg mb-3"
                    />
                  )}
                  <span className="text-sm text-muted-foreground">
                    ({question.marks} mark{question.marks !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>

              {question.type === "mcq" ? (
                <div className="space-y-2 ml-11">
                  {question.options?.map((option, optIndex) => (
                    (option || question.optionImages?.[optIndex]) && (
                      <label
                        key={optIndex}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          answers[question.id] === optIndex
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optIndex}
                          checked={answers[question.id] === optIndex}
                          onChange={() => handleAnswerChange(question.id, optIndex)}
                          className="mt-1 w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          {option && <span>{option}</span>}
                          {question.optionImages?.[optIndex] && (
                            <img
                              src={question.optionImages[optIndex]}
                              alt={`Option ${optIndex + 1}`}
                              className="max-w-sm rounded-lg mt-2"
                            />
                          )}
                        </div>
                      </label>
                    )
                  ))}
                </div>
              ) : (
                <div className="ml-11">
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="Write your answer here... (This will be manually graded)"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <button
              onClick={() => {
                if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
                  navigate(-1)
                }
              }}
              className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium"
              disabled={submitting}
            >
              Exit
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
