"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, X } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadToImgbb } from "../../lib/imgbb"

export default function ManageClasses() {
  const [courses, setCourses] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [videoType, setVideoType] = useState("youtube")
  const [formData, setFormData] = useState({
    title: "",
    chapter: "",
    subject: "",
    order: 0,
    duration: "",
    youtubeLink: "",
    hlsLink: "",
    teacherName: "",
    imageType: "upload",
    imageLink: "",
    teacherImageType: "upload",
    teacherImageLink: "",
  })
  const [imageFile, setImageFile] = useState(null)
  const [teacherImageFile, setTeacherImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [archiveSourceCourse, setArchiveSourceCourse] = useState("")
  const [teachers, setTeachers] = useState([])

  useEffect(() => {
    fetchCourses()
    fetchSubjects()
    fetchChapters()
    fetchTeachers()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchClasses()
    }
  }, [selectedCourse])

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
    }
  }

  const fetchClasses = async () => {
    try {
      const classesQuery = query(collection(db, "classes"), where("courseId", "==", selectedCourse))
      const classesSnapshot = await getDocs(classesQuery)
      const classesData = classesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => a.order - b.order)
      setClasses(classesData)
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "teachers"))
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setTeachers(data)
      console.log("[v0] Teachers loaded:", data)
    } catch (error) {
      console.error("Error fetching teachers:", error)
    }
  }

  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem)
      setFormData({
        title: classItem.title || "",
        chapter: Array.isArray(classItem.chapter) ? classItem.chapter : classItem.chapter ? [classItem.chapter] : [],
        subject: Array.isArray(classItem.subject) ? classItem.subject : classItem.subject ? [classItem.subject] : [],
        order: classItem.order || 0,
        duration: classItem.duration || "",
        youtubeLink: classItem.youtubeLink || "",
        hlsLink: classItem.hlsLink || "",
        teacherName: Array.isArray(classItem.teacherName)
          ? classItem.teacherName
          : classItem.teacherName
            ? [classItem.teacherName]
            : [],
        imageType: classItem.imageURL?.startsWith("http") ? "link" : "upload",
        imageLink: classItem.imageURL || "",
        teacherImageType: classItem.teacherImageURL?.startsWith("http") ? "link" : "upload",
        teacherImageLink: classItem.teacherImageURL || "",
      })
      setVideoType(classItem.youtubeLink ? "youtube" : "hls")
    } else {
      setEditingClass(null)
      setFormData({
        title: "",
        chapter: [],
        subject: [],
        order: classes.length,
        duration: "",
        youtubeLink: "",
        hlsLink: "",
        teacherName: [],
        imageType: "upload",
        imageLink: "",
        teacherImageType: "upload",
        teacherImageLink: "",
      })
      setVideoType("youtube")
    }
    setImageFile(null)
    setTeacherImageFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClass(null)
    setImageFile(null)
    setTeacherImageFile(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      console.log("[v0] Starting class save...")
      let imageURL = editingClass?.imageURL || ""
      let teacherImageURL = editingClass?.teacherImageURL || ""

      if (imageFile) {
        console.log("[v0] Uploading image to imgbb...")
        imageURL = await uploadToImgbb(imageFile)
        console.log("[v0] Image uploaded successfully:", imageURL)
      } else if (formData.imageType === "link") {
        imageURL = formData.imageLink
      }

      if (teacherImageFile) {
        console.log("[v0] Uploading teacher image to imgbb...")
        teacherImageURL = await uploadToImgbb(teacherImageFile)
        console.log("[v0] Teacher image uploaded successfully:", teacherImageURL)
      } else if (formData.teacherImageType === "link") {
        teacherImageURL = formData.teacherImageLink
      }

      const classData = {
        courseId: selectedCourse,
        title: formData.title,
        chapter: Array.isArray(formData.chapter) ? formData.chapter : formData.chapter ? [formData.chapter] : [],
        subject: Array.isArray(formData.subject) ? formData.subject : formData.subject ? [formData.subject] : [],
        order: Number.parseInt(formData.order),
        duration: formData.duration,
        youtubeLink: videoType === "youtube" ? formData.youtubeLink : "",
        hlsLink: videoType === "hls" ? formData.hlsLink : "",
        imageURL,
        teacherName: Array.isArray(formData.teacherName)
          ? formData.teacherName
          : formData.teacherName
            ? [formData.teacherName]
            : [],
        teacherImageURL,
      }

      console.log("[v0] Class data:", classData)

      if (editingClass) {
        console.log("[v0] Updating existing class:", editingClass.id)
        await updateDoc(doc(db, "classes", editingClass.id), classData)
        console.log("[v0] Class updated successfully")
      } else {
        console.log("[v0] Creating new class...")
        await addDoc(collection(db, "classes"), classData)
        console.log("[v0] Class created successfully")
      }

      await fetchClasses()
      handleCloseModal()
      alert(editingClass ? "Class updated successfully!" : "Class created successfully!")
    } catch (error) {
      console.error("[v0] Error saving class:", error)
      alert("Failed to save class. " + (error.message || "Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (classId) => {
    if (!confirm("Are you sure you want to delete this class?")) return

    try {
      await deleteDoc(doc(db, "classes", classId))
      await fetchClasses()
    } catch (error) {
      console.error("Error deleting class:", error)
      alert("Failed to delete class")
    }
  }

  const selectedCourseData = courses.find((c) => c.id === selectedCourse)
  const batchCourses = courses.filter((c) => c.type === "batch")

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Classes</h1>
            <p className="text-muted-foreground">Create and manage course classes</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            disabled={!selectedCourse}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Class
          </button>
        </div>
      </motion.div>

      {/* Course Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choose a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.type})
            </option>
          ))}
        </select>
      </div>

      {/* Classes Table */}
      {selectedCourse && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium">Title</th>
                  {selectedCourseData?.type === "batch" && <th className="text-left p-4 font-medium">Subject</th>}
                  <th className="text-left p-4 font-medium">Chapter</th>
                  <th className="text-left p-4 font-medium">Teacher</th>
                  <th className="text-left p-4 font-medium">Order</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classes.map((classItem) => (
                  <tr key={classItem.id} className="hover:bg-muted/50">
                    <td className="p-4 text-sm">{classItem.title}</td>
                    {selectedCourseData?.type === "batch" && (
                      <td className="p-4 text-sm text-muted-foreground">{classItem.subject || "N/A"}</td>
                    )}
                    <td className="p-4 text-sm text-muted-foreground">{classItem.chapter || "N/A"}</td>
                    <td className="p-4 text-sm">
                      {classItem.teacherImageURL && (
                        <img
                          src={classItem.teacherImageURL || "/placeholder.svg"}
                          alt={classItem.teacherName}
                          className="w-8 h-8 rounded-full object-cover inline-block mr-2"
                        />
                      )}
                      <span className="text-sm">{classItem.teacherName || "N/A"}</span>
                    </td>
                    <td className="p-4 text-sm">{classItem.order}</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenModal(classItem)}
                          className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(classItem.id)}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {classes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No classes yet. Add your first class!</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingClass ? "Edit Class" : "Add New Class"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
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
                <label className="block text-sm font-medium mb-2">Teacher Name</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 p-3 bg-background border border-border rounded-lg min-h-[120px]">
                    {Array.isArray(formData.teacherName) &&
                      formData.teacherName.map((name, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.teacherName.filter((_, i) => i !== idx)
                              setFormData({ ...formData, teacherName: updated })
                            }}
                            className="text-primary hover:text-primary/70"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                  <select
                    onChange={(e) => {
                      const value = e.target.value
                      if (value) {
                        const current = Array.isArray(formData.teacherName) ? formData.teacherName : []
                        if (!current.includes(value)) {
                          setFormData({ ...formData, teacherName: [...current, value] })
                        }
                        e.target.value = ""
                      }
                    }}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Add teacher...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Click to add multiple teachers</p>
              </div>

              {selectedCourseData?.type === "batch" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 p-3 bg-background border border-border rounded-lg min-h-[120px]">
                      {Array.isArray(formData.subject) &&
                        formData.subject.map((name, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                          >
                            {name}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.subject.filter((_, i) => i !== idx)
                                setFormData({ ...formData, subject: updated })
                              }}
                              className="text-primary hover:text-primary/70"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                    <select
                      onChange={(e) => {
                        const value = e.target.value
                        if (value) {
                          const current = Array.isArray(formData.subject) ? formData.subject : []
                          if (!current.includes(value)) {
                            setFormData({ ...formData, subject: [...current, value] })
                          }
                          e.target.value = ""
                        }
                      }}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Add subject...</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.title}>
                          {subject.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Click to add multiple subjects</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Chapter</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 p-3 bg-background border border-border rounded-lg min-h-[120px]">
                    {Array.isArray(formData.chapter) &&
                      formData.chapter.map((name, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.chapter.filter((_, i) => i !== idx)
                              setFormData({ ...formData, chapter: updated })
                            }}
                            className="text-primary hover:text-primary/70"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                  <select
                    onChange={(e) => {
                      const value = e.target.value
                      if (value) {
                        const current = Array.isArray(formData.chapter) ? formData.chapter : []
                        if (!current.includes(value)) {
                          setFormData({ ...formData, chapter: [...current, value] })
                        }
                        e.target.value = ""
                      }
                    }}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Add chapter...</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.title}>
                        {chapter.title}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Click to add multiple chapters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 45 min"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Video Source</label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setVideoType("youtube")}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      videoType === "youtube"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    YouTube Link
                  </button>
                </div>

                {videoType === "youtube" ? (
                  <div>
                    <input
                      type="url"
                      value={formData.youtubeLink}
                      onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required={videoType === "youtube"}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste a YouTube video URL (supports youtube.com and youtu.be links)
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingClass ? "Update Class" : "Create Class"}
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
