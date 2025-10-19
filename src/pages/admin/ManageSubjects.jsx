"use client"
import { toast } from "../../hooks/use-toast"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from "firebase/firestore"
import { db } from "../../lib/firebase"

export default function ManageSubjects() {
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [bulkSubjects, setBulkSubjects] = useState([{ title: "", description: "" }])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  useEffect(() => {
    fetchCourses()
    fetchSubjects()
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
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject)
      setFormData({
        title: subject.title,
        description: subject.description || "",
      })
    } else {
      setEditingSubject(null)
      setFormData({
        title: "",
        description: "",
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSubject(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingSubject) {
        await updateDoc(doc(db, "subjects", editingSubject.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, "subjects"), {
          ...formData,
          createdAt: serverTimestamp(),
        })
      }

      await fetchSubjects()
      handleCloseModal()
      alert(editingSubject ? "Subject updated successfully!" : "Subject created successfully!")
    } catch (error) {
      console.error("Error saving subject:", error)
      alert("Failed to save subject")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this subject?")) return

    try {
      await deleteDoc(doc(db, "subjects", id))
      await fetchSubjects()
    } catch (error) {
      console.error("Error deleting subject:", error)
      alert("Failed to delete subject")
    }
  }

  const handleBulkAdd = (index) => {
    setBulkSubjects([...bulkSubjects.slice(0, index + 1), { title: "", description: "" }, ...bulkSubjects.slice(index + 1)])
  }

  const handleBulkRemove = (index) => {
    if (bulkSubjects.length > 1) {
      setBulkSubjects(bulkSubjects.filter((_, i) => i !== index))
    }
  }

  const handleBulkChange = (index, field, value) => {
    const updated = [...bulkSubjects]
    updated[index][field] = value
    setBulkSubjects(updated)
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedCourse) {
      alert("Please select a batch course first!")
      return
    }

    const validSubjects = bulkSubjects.filter(s => s.title.trim() !== "")
    if (validSubjects.length === 0) {
      alert("Please add at least one subject with a title!")
      return
    }

    setSubmitting(true)
    try {
      for (const subject of validSubjects) {
        await addDoc(collection(db, "subjects"), {
          title: subject.title,
          description: subject.description,
          courseId: selectedCourse,
          createdAt: serverTimestamp(),
        })
      }

      await fetchSubjects()
      setBulkSubjects([{ title: "", description: "" }])
      setSelectedCourse("")
      setShowBulkForm(false)
      alert(`Successfully created ${validSubjects.length} subject(s)!`)
    } catch (error) {
      console.error("Error creating subjects:", error)
      alert("Failed to create subjects. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const batchCourses = courses.filter(c => c.type === "batch")
  const filteredSubjects = selectedCourse 
    ? subjects.filter(s => s.courseId === selectedCourse)
    : subjects

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Subjects</h1>
            <p className="text-muted-foreground">Create and manage subjects for batch courses</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkForm(!showBulkForm)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Bulk Create
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Subject
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bulk Create Form */}
      {showBulkForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Bulk Create Subjects</h2>
            <button 
              onClick={() => setShowBulkForm(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Batch Course *</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a batch course...</option>
                {batchCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {batchCourses.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No batch courses found. Create a batch course first.</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Subjects</label>
              {bulkSubjects.map((subject, index) => (
                <div key={index} className="flex gap-3 items-start p-4 bg-background border border-border rounded-lg">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      placeholder="Subject title *"
                      value={subject.title}
                      onChange={(e) => handleBulkChange(index, "title", e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <textarea
                      placeholder="Subject description (optional)"
                      value={subject.description}
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
                      title="Add subject below"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {bulkSubjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleBulkRemove(index)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        title="Remove this subject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting || !selectedCourse}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? "Creating..." : `Create ${bulkSubjects.filter(s => s.title.trim()).length} Subject(s)`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBulkForm(false)
                  setBulkSubjects([{ title: "", description: "" }])
                  setSelectedCourse("")
                }}
                className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cancel
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
          className="w-full max-w-md px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Subjects</option>
          {batchCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="font-semibold text-lg mb-2">{subject.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{subject.description}</p>
              {subject.courseId && (
                <p className="text-xs text-primary mb-3">
                  Course: {courses.find(c => c.id === subject.courseId)?.title || "Unknown"}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(subject)}
                  className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(subject.id)}
                  className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredSubjects.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No subjects found. Create your first subject!</p>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingSubject ? "Edit Subject" : "Add New Subject"}</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                >
                  {editingSubject ? "Update Subject" : "Create Subject"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
