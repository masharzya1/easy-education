"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadToImgbb } from "../../lib/imgbb"

export default function ManageCourses() {
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    type: "subject",
    description: "",
    teachers: [],
    teacherInput: "",
    price: 0,
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCourses()
    fetchTeachers()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const teachersSnapshot = await getDocs(collection(db, "teachers"))
      const teachersData = teachersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setTeachers(teachersData)
    } catch (error) {
      console.error("Error fetching teachers:", error)
    }
  }

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
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        title: course.title,
        category: course.category,
        type: course.type,
        description: course.description,
        teachers: course.teachers || [],
        teacherInput: "",
        price: course.price || 0,
      })
    } else {
      setEditingCourse(null)
      setFormData({
        title: "",
        category: "",
        type: "subject",
        description: "",
        teachers: [],
        teacherInput: "",
        price: 0,
      })
    }
    setThumbnailFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCourse(null)
    setThumbnailFile(null)
  }

  const handleAddTeacher = () => {
    if (formData.teacherInput.trim()) {
      const newTeachers = [...formData.teachers, formData.teacherInput.trim()]
      setFormData({ ...formData, teachers: newTeachers, teacherInput: "" })
    }
  }

  const handleRemoveTeacher = (index) => {
    const newTeachers = formData.teachers.filter((_, i) => i !== index)
    setFormData({ ...formData, teachers: newTeachers })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      console.log(" Starting course save...")
      let thumbnailURL = editingCourse?.thumbnailURL || ""

      if (thumbnailFile) {
        console.log(" Uploading thumbnail to imgbb...")
        try {
          thumbnailURL = await uploadToImgbb(thumbnailFile)
          console.log(" Thumbnail uploaded successfully:", thumbnailURL)
        } catch (uploadError) {
          console.error(" Thumbnail upload error:", uploadError)
          throw new Error(uploadError.message || "Failed to upload thumbnail. Please try again.")
        }
      }

      const courseData = {
        title: formData.title,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        teachers: formData.teachers,
        thumbnailURL,
        price: Number.parseFloat(formData.price) || 0,
      }

      console.log(" Course data:", courseData)

      if (editingCourse) {
        console.log(" Updating existing course:", editingCourse.id)
        await updateDoc(doc(db, "courses", editingCourse.id), courseData)
        console.log(" Course updated successfully")
      } else {
        console.log(" Creating new course...")
        const docRef = await addDoc(collection(db, "courses"), {
          ...courseData,
          createdAt: serverTimestamp(),
        })
        console.log(" Course created successfully with ID:", docRef.id)
      }

      await fetchCourses()
      handleCloseModal()
      alert(editingCourse ? "Course updated successfully!" : "Course created successfully!")
    } catch (error) {
      console.error(" Error saving course:", error)
      alert("Failed to save course. " + (error.message || "Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (courseId) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    try {
      await deleteDoc(doc(db, "courses", courseId))
      setCourses(courses.filter((c) => c.id !== courseId))
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Courses</h1>
            <p className="text-muted-foreground">Create and manage courses</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Course
          </button>
        </div>
      </motion.div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="aspect-video bg-muted rounded-lg mb-4"></div>
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
                {course.thumbnailURL && (
                  <img
                    src={course.thumbnailURL || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">{course.category}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(course)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingCourse ? "Edit Course" : "Add New Course"}</h2>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.title}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="subject">Subject</option>
                    <option value="batch">Batch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teachers</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={formData.teacherInput}
                      onChange={(e) => setFormData({ ...formData, teacherInput: e.target.value })}
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.name}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddTeacher}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {formData.teachers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.teachers.map((teacher, index) => (
                        <div
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                        >
                          {teacher}
                          <button
                            type="button"
                            onClick={() => handleRemoveTeacher(index)}
                            className="text-primary hover:text-primary/70"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
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
