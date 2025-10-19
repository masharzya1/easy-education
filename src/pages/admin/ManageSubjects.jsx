"use client"
import { toast } from "../../hooks/use-toast"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  useEffect(() => {
    fetchSubjects()
  }, [])

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

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Subjects</h1>
            <p className="text-muted-foreground">Create and manage subjects for batch courses</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Subject
          </button>
        </div>
      </motion.div>

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
          {subjects.map((subject) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="font-semibold text-lg mb-2">{subject.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{subject.description}</p>
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

      {/* Modal */}
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
