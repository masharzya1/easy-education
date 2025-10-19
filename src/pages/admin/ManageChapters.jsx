"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { toast } from "../../hooks/use-toast"

export default function ManageChapters() {
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  useEffect(() => {
    fetchChapters()
  }, [])

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

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">Manage Chapters</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Create and manage chapters for courses</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Chapter
          </button>
        </div>
      </motion.div>

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
          {chapters.map((chapter) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-lg p-3 sm:p-4"
            >
              <h3 className="font-semibold text-sm sm:text-base mb-1">{chapter.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">{chapter.description}</p>
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

      {/* Modal */}
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
