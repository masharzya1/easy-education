import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, X, Archive } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadToImgbb } from "../../lib/imgbb"

export default function ManageClasses() {
  const [courses, setCourses] = useState([])
  const [classes, setClasses] = useState([])
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

  useEffect(() => {
    fetchCourses()
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

  const handleArchiveCourses = async () => {
    if (!archiveSourceCourse || !selectedCourse) return

    setSubmitting(true)
    try {
      const sourceClassesQuery = query(collection(db, "classes"), where("courseId", "==", archiveSourceCourse))
      const sourceClassesSnapshot = await getDocs(sourceClassesQuery)

      const batch = writeBatch(db)
      let maxOrder = classes.length

      sourceClassesSnapshot.docs.forEach((docSnap) => {
        const classData = docSnap.data()
        const newClassRef = doc(collection(db, "classes"))
        batch.set(newClassRef, {
          ...classData,
          courseId: selectedCourse,
          chapter: "Archive",
          order: maxOrder++,
        })
      })

      await batch.commit()
      await fetchClasses()
      setShowArchiveModal(false)
      alert(`Successfully archived ${sourceClassesSnapshot.docs.length} classes!`)
    } catch (error) {
      console.error("Error archiving courses:", error)
      alert("Failed to archive courses. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem)
      const isYouTube = classItem.videoURL?.includes("youtube.com") || classItem.videoURL?.includes("youtu.be")
      const isHLS = classItem.videoType === "hls" || classItem.videoURL?.includes(".m3u8")
      setVideoType(isYouTube ? "youtube" : isHLS ? "hls" : "youtube")
      setFormData({
        title: classItem.title,
        chapter: classItem.chapter || "",
        subject: classItem.subject || "",
        order: classItem.order,
        duration: classItem.duration || "",
        youtubeLink: isYouTube ? classItem.videoURL : "",
        hlsLink: isHLS ? classItem.videoURL : "",
        teacherName: classItem.teacherName || "",
        imageType: classItem.imageURL?.startsWith("http") ? "link" : "upload",
        imageLink: classItem.imageURL || "",
        teacherImageType: classItem.teacherImageURL?.startsWith("http") ? "link" : "upload",
        teacherImageLink: classItem.teacherImageURL || "",
      })
    } else {
      setEditingClass(null)
      setVideoType("youtube")
      setFormData({
        title: "",
        chapter: "",
        subject: "",
        order: classes.length,
        duration: "",
        youtubeLink: "",
        hlsLink: "",
        teacherName: "",
        imageType: "upload",
        imageLink: "",
        teacherImageType: "upload",
        teacherImageLink: "",
      })
    }
    setImageFile(null)
    setTeacherImageFile(null)
    setShowModal(true)
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return ""

    let videoId = ""

    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0]
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0]
    } else if (url.includes("youtube.com/embed/")) {
      return url // Already an embed URL
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCourse) return

    setSubmitting(true)

    try {
      let videoURL = editingClass?.videoURL || ""
      let imageURL = editingClass?.imageURL || ""
      let teacherImageURL = editingClass?.teacherImageURL || ""

      if (videoType === "youtube") {
        videoURL = getYouTubeEmbedUrl(formData.youtubeLink)
      } else if (videoType === "hls") {
        videoURL = formData.hlsLink
      }

      if (formData.imageType === "link") {
        imageURL = formData.imageLink
      } else if (imageFile) {
        console.log(" Uploading class image to imgbb...")
        imageURL = await uploadToImgbb(imageFile)
        console.log(" Class image uploaded successfully:", imageURL)
      }

      if (formData.teacherImageType === "link") {
        teacherImageURL = formData.teacherImageLink
      } else if (teacherImageFile) {
        console.log(" Uploading teacher image to imgbb...")
        teacherImageURL = await uploadToImgbb(teacherImageFile)
        console.log(" Teacher image uploaded successfully:", teacherImageURL)
      }

      const classData = {
        courseId: selectedCourse,
        title: formData.title,
        chapter: formData.chapter,
        subject: formData.subject,
        order: Number.parseInt(formData.order),
        duration: formData.duration,
        videoURL,
        videoType,
        teacherName: formData.teacherName,
        imageURL,
        teacherImageURL,
        votesCount: editingClass?.votesCount || 0,
      }

      console.log(" Saving class with data:", classData)

      if (editingClass) {
        await updateDoc(doc(db, "classes", editingClass.id), classData)
      } else {
        await addDoc(collection(db, "classes"), classData)
      }

      await fetchClasses()
      setShowModal(false)
    } catch (error) {
      console.error("Error saving class:", error)
      alert(error.message || "Failed to save class. Please check your inputs and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (classId) => {
    if (!confirm("Are you sure you want to delete this class?")) return

    try {
      await deleteDoc(doc(db, "classes", classId))
      setClasses(classes.filter((c) => c.id !== classId))
    } catch (error) {
      console.error("Error deleting class:", error)
    }
  }

  const selectedCourseData = courses.find((c) => c.id === selectedCourse)
  const batchCourses = courses.filter((c) => c.type === "batch")

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Classes</h1>
        <p className="text-muted-foreground">Add and manage classes for courses</p>
      </motion.div>

      {/* Course Selector */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium mb-2">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choose a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.type})
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <p className="text-muted-foreground">{classes.length} classes in this course</p>
            <div className="flex gap-3">
              {selectedCourseData?.type === "batch" && (
                <button
                  onClick={() => setShowArchiveModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg transition-colors"
                >
                  <Archive className="w-5 h-5" />
                  Archive Old Batch
                </button>
              )}
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Class
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {classes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-medium">Title</th>
                      <th className="text-left p-4 font-medium">Teacher</th>
                      {selectedCourseData?.type === "batch" && <th className="text-left p-4 font-medium">Subject</th>}
                      <th className="text-left p-4 font-medium">Chapter</th>
                      <th className="text-left p-4 font-medium">Order</th>
                      <th className="text-left p-4 font-medium">Duration</th>
                      <th className="text-left p-4 font-medium">Votes</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classes.map((classItem) => (
                      <tr key={classItem.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-medium">{classItem.title}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {classItem.teacherImageURL && (
                              <img
                                src={classItem.teacherImageURL || "/placeholder.svg"}
                                alt={classItem.teacherName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <span className="text-sm">{classItem.teacherName || "N/A"}</span>
                          </div>
                        </td>
                        {selectedCourseData?.type === "batch" && (
                          <td className="p-4 text-sm text-muted-foreground">{classItem.subject || "N/A"}</td>
                        )}
                        <td className="p-4 text-sm text-muted-foreground">{classItem.chapter || "N/A"}</td>
                        <td className="p-4 text-sm">{classItem.order}</td>
                        <td className="p-4 text-sm text-muted-foreground">{classItem.duration || "N/A"}</td>
                        <td className="p-4 text-sm">{classItem.votesCount || 0}</td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(classItem)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(classItem.id)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No classes yet. Add your first class!</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Archive Old Batch</h2>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-muted-foreground mb-4">
              Select a batch course to archive. All classes from the selected course will be copied to the current
              course under an "Archive" chapter.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Source Batch Course</label>
                <select
                  value={archiveSourceCourse}
                  onChange={(e) => setArchiveSourceCourse(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a batch course...</option>
                  {batchCourses
                    .filter((c) => c.id !== selectedCourse)
                    .map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleArchiveCourses}
                  disabled={!archiveSourceCourse || submitting}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Archiving..." : "Archive Classes"}
                </button>
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
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
                <input
                  type="text"
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  placeholder="Enter teacher name"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Teacher Image (Optional)</label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, teacherImageType: "upload" })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      formData.teacherImageType === "upload"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, teacherImageType: "link" })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      formData.teacherImageType === "link"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    Image Link
                  </button>
                </div>

                {formData.teacherImageType === "link" ? (
                  <div>
                    <input
                      type="url"
                      value={formData.teacherImageLink}
                      onChange={(e) => setFormData({ ...formData, teacherImageLink: e.target.value })}
                      placeholder="https://example.com/teacher.jpg"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Paste a teacher image URL</p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTeacherImageFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {selectedCourseData?.type === "batch" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Chapter</label>
                <input
                  type="text"
                  value={formData.chapter}
                  onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                  <button
                    type="button"
                    onClick={() => setVideoType("hls")}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      videoType === "hls"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    Server 2
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
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formData.hlsLink}
                      onChange={(e) => setFormData({ ...formData, hlsLink: e.target.value })}
                      placeholder="https://example.com/video.m3u8 or Google Drive link"
                      required={videoType === "hls"}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste an HLS video link (.m3u8) from Google Drive or any other source
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Class Image (Optional)</label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageType: "upload" })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      formData.imageType === "upload"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageType: "link" })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      formData.imageType === "link"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    Image Link
                  </button>
                </div>

                {formData.imageType === "link" ? (
                  <div>
                    <input
                      type="url"
                      value={formData.imageLink}
                      onChange={(e) => setFormData({ ...formData, imageLink: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Paste an image URL</p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
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
                  onClick={() => setShowModal(false)}
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
