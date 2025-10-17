import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { uploadToImgbb } from "../../lib/imgbb"

export default function ManageNews() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const newsSnapshot = await getDocs(collection(db, "news"))
      const newsData = newsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setNews(newsData)
    } catch (error) {
      console.error("Error fetching news:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (newsItem = null) => {
    if (newsItem) {
      setEditingNews(newsItem)
      setFormData({
        title: newsItem.title,
        description: newsItem.description,
      })
    } else {
      setEditingNews(null)
      setFormData({
        title: "",
        description: "",
      })
    }
    setImageFile(null)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let imageURL = editingNews?.imageURL || ""

      if (imageFile) {
        console.log(" Uploading image to imgbb...")
        try {
          imageURL = await uploadToImgbb(imageFile)
          console.log(" Image uploaded successfully:", imageURL)
        } catch (uploadError) {
          console.error(" Image upload error:", uploadError)
          throw new Error(uploadError.message || "Failed to upload image. Please try again.")
        }
      }

      const newsData = {
        title: formData.title,
        description: formData.description,
        imageURL,
        date: serverTimestamp(),
      }

      if (editingNews) {
        await updateDoc(doc(db, "news", editingNews.id), newsData)
      } else {
        await addDoc(collection(db, "news"), newsData)
      }

      await fetchNews()
      setShowModal(false)
    } catch (error) {
      console.error("Error saving news:", error)
      alert(error.message || "Failed to save news. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (newsId) => {
    if (!confirm("Are you sure you want to delete this news article?")) return

    try {
      await deleteDoc(doc(db, "news", newsId))
      setNews(news.filter((n) => n.id !== newsId))
    } catch (error) {
      console.error("Error deleting news:", error)
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage News</h1>
            <p className="text-muted-foreground">Create and manage news articles</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add News
          </button>
        </div>
      </motion.div>

      {/* News Grid */}
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
          {news.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
                {item.imageURL && (
                  <img
                    src={item.imageURL || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {item.date?.toDate?.()?.toLocaleDateString() || "Recently"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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
              <h2 className="text-2xl font-bold">{editingNews ? "Edit News" : "Add New News"}</h2>
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
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingNews ? "Update News" : "Create News"}
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
