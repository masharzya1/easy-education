import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, FileQuestion, BookOpen, GraduationCap, Upload, Download } from "lucide-react"
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { useExam } from "../../contexts/ExamContext"
import { toast } from "../../hooks/use-toast"
import { Link } from "react-router-dom"

export default function ManageExams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [courses, setCourses] = useState([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkData, setBulkData] = useState("")
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    duration: 60,
    passingScore: 70,
  })

  const { createExam, updateExam, deleteExam } = useExam()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const examsSnapshot = await getDocs(query(collection(db, "exams"), orderBy("createdAt", "desc")))
      const examsData = await Promise.all(
        examsSnapshot.docs.map(async (examDoc) => {
          const exam = { id: examDoc.id, ...examDoc.data() }
          
          if (exam.courseId) {
            const courseDoc = await getDoc(doc(db, "courses", exam.courseId))
            if (courseDoc.exists()) {
              exam.courseName = courseDoc.data().title
            }
          }
          
          return exam
        })
      )
      setExams(examsData)

      const coursesSnapshot = await getDocs(collection(db, "courses"))
      const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to load exams",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.courseId) {
      toast({
        variant: "error",
        title: "Missing Fields",
        description: "Please fill in all required fields",
      })
      return
    }

    try {
      if (editingExam) {
        await updateExam(editingExam.id, formData)
        toast({
          title: "Success",
          description: "Exam updated successfully",
        })
      } else {
        await createExam(formData)
        toast({
          title: "Success",
          description: "Exam created successfully",
        })
      }
      
      setShowModal(false)
      setEditingExam(null)
      setFormData({
        title: "",
        description: "",
        courseId: "",
        duration: 60,
        passingScore: 70,
      })
      fetchData()
    } catch (error) {
      console.error("Error saving exam:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to save exam",
      })
    }
  }

  const handleEdit = (exam) => {
    setEditingExam(exam)
    setFormData({
      title: exam.title,
      description: exam.description || "",
      courseId: exam.courseId,
      duration: exam.duration || 60,
      passingScore: exam.passingScore || 70,
    })
    setShowModal(true)
  }

  const handleDelete = async (examId) => {
    if (!confirm("Are you sure you want to delete this exam? This will also delete all questions.")) return

    try {
      await deleteExam(examId)
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting exam:", error)
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to delete exam",
      })
    }
  }

  const handleBulkUpload = async () => {
    if (!bulkData.trim()) {
      toast({
        variant: "error",
        title: "Empty Data",
        description: "Please provide JSON data for bulk upload",
      })
      return
    }

    setBulkProcessing(true)
    try {
      const examsArray = JSON.parse(bulkData)
      
      if (!Array.isArray(examsArray)) {
        throw new Error("Data must be an array of exams")
      }

      let successCount = 0
      let errorCount = 0

      for (const exam of examsArray) {
        try {
          await createExam({
            title: exam.title || "Untitled Exam",
            description: exam.description || "",
            courseId: exam.courseId || "",
            duration: exam.duration || 60,
            passingScore: exam.passingScore || 70,
          })
          successCount++
        } catch (err) {
          console.error("Error creating exam:", err)
          errorCount++
        }
      }

      toast({
        title: "Bulk Upload Complete",
        description: `Successfully created ${successCount} exam(s). ${errorCount > 0 ? `Failed: ${errorCount}` : ""}`,
      })

      setShowBulkModal(false)
      setBulkData("")
      fetchData()
    } catch (error) {
      console.error("Error parsing bulk data:", error)
      toast({
        variant: "error",
        title: "Invalid JSON",
        description: "Please check your JSON format and try again",
      })
    } finally {
      setBulkProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        title: "Math Final Exam",
        description: "Comprehensive math test covering all chapters",
        courseId: "YOUR_COURSE_ID_HERE",
        duration: 90,
        passingScore: 70
      },
      {
        title: "Science Quiz",
        description: "Quick quiz on basic science concepts",
        courseId: "YOUR_COURSE_ID_HERE",
        duration: 30,
        passingScore: 60
      }
    ]
    
    const dataStr = JSON.stringify(template, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "exams_template.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Exams</h1>
          <p className="text-muted-foreground mt-1">Create and manage exams for courses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>
          <button
            onClick={() => {
              setEditingExam(null)
              setFormData({
                title: "",
                description: "",
                courseId: "",
                duration: 60,
                passingScore: 70,
              })
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Exam</span>
          </button>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <FileQuestion className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No exams created yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Your First Exam
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground">{exam.description}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{exam.courseName || "Unknown Course"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="w-4 h-4" />
                  <span>{exam.duration} minutes • Passing: {exam.passingScore}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/admin/exams/${exam.id}/questions`}
                  className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-center text-sm font-medium"
                >
                  <FileQuestion className="w-4 h-4 inline mr-1" />
                  Questions
                </Link>
                <button
                  onClick={() => handleEdit(exam)}
                  className="px-3 py-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(exam.id)}
                  className="px-3 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-lg p-4 sm:p-6 w-full max-w-md my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{editingExam ? "Edit Exam" : "Create New Exam"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Exam Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Physics Chapter 1 Exam"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Brief description of the exam"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Course *</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Passing Score (%)</label>
                  <input
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingExam(null)
                  }}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                >
                  {editingExam ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4">Bulk Upload Exams</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create multiple exams at once using JSON format. Download the template to see the correct format.
            </p>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-4"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>

            <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Note:</strong> Replace "YOUR_COURSE_ID_HERE" with actual course IDs from your system.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Paste JSON Data</label>
              <textarea
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows={15}
                placeholder='[\n  {\n    "title": "Math Final Exam",\n    "description": "Comprehensive test",\n    "courseId": "course_id_here",\n    "duration": 90,\n    "passingScore": 70\n  }\n]'
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBulkModal(false)
                  setBulkData("")
                }}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                disabled={bulkProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                disabled={bulkProcessing}
              >
                {bulkProcessing ? "Processing..." : "Upload Exams"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
