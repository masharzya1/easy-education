"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { toast } from "../../hooks/use-toast"

export default function ManageChapters() {
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [bulkChapters, setBulkChapters] = useState([{ title: "", description: "" }])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  useEffect(() => {
    fetchCourses()
    fetchSubjects()
    fetchChapters()
  }, [])

  const fetchCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, "courses"))
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const snapshot = await getDocs(collection(db, "subjects"))
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setSubjects(data)
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchChapters = async () => {
    try {
      const snapshot = await getDocs(collection(db, "chapters"))
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setChapters(data)
    } catch (error) {
      console.error("Error fetching chapters:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (chapter = null) => {
    if (chapter) {
      setEditingChapter(chapter)
      setFormData({
        title: chapter.title,
        description: chapter.description || "",
      })
    } else {
      setEditingChapter(null)
      setFormData({
        title: "",
        description: "",
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingChapter(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingChapter) {
        await updateDoc(doc(db, "chapters", editingChapter.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, "chapters"), {
          ...formData,
          createdAt: serverTimestamp(),
        })
      }

      await fetchChapters()
      handleCloseModal()
      toast({
        variant: "success",
        title: editingChapter ? "Chapter Updated" : "Chapter Created",
        description: editingChapter ? "Chapter updated successfully!" : "Chapter created successfully!",
      })
    } catch (error) {
      console.error("Error saving chapter:", error)
      toast({
        variant: "error",
        title: "Save Failed",
        description: "Failed to save chapter",
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return

    try {
      await deleteDoc(doc(db, "chapters", id))
      await fetchChapters()
      toast({
        variant: "success",
        title: "Chapter Deleted",
        description: "Chapter deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting chapter:", error)
      toast({
        variant: "error",
        title: "Deletion Failed",
        description: "Failed to delete chapter",
      })
    }
  }

  const handleBulkAdd = (index) => {
    setBulkChapters([...bulkChapters.slice(0, index + 1), { title: "", description: "" }, ...bulkChapters.slice(index + 1)])
  }

  const handleBulkRemove = (index) => {
    if (bulkChapters.length > 1) {
      setBulkChapters(bulkChapters.filter((_, i) => i !== index))
    }
  }

  const handleBulkChange = (index, field, value) => {
    const updated = [...bulkChapters]
    updated[index][field] = value
    setBulkChapters(updated)
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedCourse) {
      alert("Please select a course first!")
      return
    }

    const validChapters = bulkChapters.filter(c => c.title.trim() !== "")
    if (validChapters.length === 0) {
      alert("Please add at least one chapter with a title!")
      return
    }

    setSubmitting(true)
    try {
      const selectedCourseData = courses.find(c => c.id === selectedCourse)
      for (const chapter of validChapters) {
        const chapterData = {
          title: chapter.title,
          description: chapter.description,
          courseId: selectedCourse,
          createdAt: serverTimestamp(),
        }
        
        if (selectedCourseData?.type === "batch" && selectedSubject) {
          chapterData.subjectId = selectedSubject
        }
        
        await addDoc(collection(db, "chapters"), chapterData)
      }

      await fetchChapters()
      setBulkChapters([{ title: "", description: "" }])
      setSelectedCourse("")
      setSelectedSubject("")
      setShowBulkForm(false)
      toast({
        variant: "success",
        title: "Chapters Created",
        description: `Successfully created ${validChapters.length} chapter(s)!`,
      })
    } catch (error) {
      console.error("Error creating chapters:", error)
      toast({
        variant: "error",
        title: "Creation Failed",
        description: "Failed to create chapters. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse)
  const isBatchCourse = selectedCourseData?.type === "batch"
  const courseSubjects = subjects.filter(s => s.courseId === selectedCourse)
  const filteredChapters = selectedCourse 
    ? chapters.filter(c => c.courseId === selectedCourse)
    : chapters

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">Manage Chapters</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Create and manage chapters for courses</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkForm(!showBulkForm)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Bulk Create Chapters
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bulk Create Form */}
      {showBulkForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Bulk Create Chapters</h2>
            <button 
              onClick={() => setShowBulkForm(false)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Course *</label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value)
                  setSelectedSubject("")
                }}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.type})
                  </option>
                ))}
              </select>
            </div>

            {isBatchCourse && courseSubjects.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Subject (optional for batch courses)</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">All subjects / No specific subject</option>
                  {courseSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium">Chapters</label>
              {bulkChapters.map((chapter, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-background border border-border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Chapter title *"
                      value={chapter.title}
                      onChange={(e) => handleBulkChange(index, "title", e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <textarea
                      placeholder="Chapter description (optional)"
                      value={chapter.description}
                      onChange={(e) => handleBulkChange(index, "description", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkAdd(index)}
                      className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                      title="Add chapter below"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {bulkChapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleBulkRemove(index)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        title="Remove this chapter"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowBulkForm(false)
                  setBulkChapters([{ title: "", description: "" }])
                  setSelectedCourse("")
                  setSelectedSubject("")
                }}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedCourse}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : `Create ${bulkChapters.filter(c => c.title.trim()).length} Chapter(s)`}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Course Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Course (optional)</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="">All Chapters</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.type})
            </option>
          ))}
        </select>
      </div>

      {/* Chapters Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 sm:p-4 animate-pulse">
              <div className="h-5 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredChapters.map((chapter) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-lg p-3 sm:p-4"
            >
              <h3 className="font-semibold text-sm sm:text-base mb-1">{chapter.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">{chapter.description}</p>
              {chapter.courseId && (
                <p className="text-xs text-primary mb-2">
                  Course: {courses.find(c => c.id === chapter.courseId)?.title || "Unknown"}
                </p>
              )}
              {chapter.subjectId && (
                <p className="text-xs text-secondary mb-2">
                  Subject: {subjects.find(s => s.id === chapter.subjectId)?.title || "Unknown"}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(chapter)}
                  className="flex-1 px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 text-xs"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(chapter.id)}
                  className="flex-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5 text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredChapters.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No chapters found. Create your first chapter!</p>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingChapter ? "Edit Chapter" : "Add New Chapter"}</h2>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Enter chapter title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                  placeholder="Enter chapter description (optional)"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
                >
                  {editingChapter ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
