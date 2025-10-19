import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Calendar, ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react"
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"

export default function NewsDetail() {
  const { newsId } = useParams()
  const { currentUser } = useAuth()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews()
  }, [newsId])

  const fetchNews = async () => {
    try {
      const newsDoc = await getDoc(doc(db, "news", newsId))
      if (newsDoc.exists()) {
        setNews({ id: newsDoc.id, ...newsDoc.data() })
      }
    } catch (error) {
      console.error("Error fetching news:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!currentUser) {
      alert("You must be logged in to like.")
      return
    }

    try {
      const newsRef = doc(db, "news", newsId)
      const likes = news.likes || []
      const dislikes = news.dislikes || []

      if (likes.includes(currentUser.uid)) {
        // Remove like
        await updateDoc(newsRef, {
          likes: arrayRemove(currentUser.uid),
        })
        setNews({ ...news, likes: likes.filter((id) => id !== currentUser.uid) })
      } else {
        // Add like and remove dislike if exists
        const updates = {
          likes: arrayUnion(currentUser.uid),
        }
        if (dislikes.includes(currentUser.uid)) {
          updates.dislikes = arrayRemove(currentUser.uid)
        }
        await updateDoc(newsRef, updates)
        setNews({
          ...news,
          likes: [...likes, currentUser.uid],
          dislikes: dislikes.filter((id) => id !== currentUser.uid),
        })
      }
    } catch (error) {
      console.error("Error liking news:", error)
      alert("Failed to like. Please try again.")
    }
  }

  const handleDislike = async () => {
    if (!currentUser) {
      alert("You must be logged in to dislike.")
      return
    }

    try {
      const newsRef = doc(db, "news", newsId)
      const likes = news.likes || []
      const dislikes = news.dislikes || []

      if (dislikes.includes(currentUser.uid)) {
        // Remove dislike
        await updateDoc(newsRef, {
          dislikes: arrayRemove(currentUser.uid),
        })
        setNews({ ...news, dislikes: dislikes.filter((id) => id !== currentUser.uid) })
      } else {
        // Add dislike and remove like if exists
        const updates = {
          dislikes: arrayUnion(currentUser.uid),
        }
        if (likes.includes(currentUser.uid)) {
          updates.likes = arrayRemove(currentUser.uid)
        }
        await updateDoc(newsRef, updates)
        setNews({
          ...news,
          dislikes: [...dislikes, currentUser.uid],
          likes: likes.filter((id) => id !== currentUser.uid),
        })
      }
    } catch (error) {
      console.error("Error disliking news:", error)
      alert("Failed to dislike. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">News not found</h2>
          <p className="text-muted-foreground mb-4">The news article you're looking for doesn't exist.</p>
          <Link to="/news" className="text-primary hover:underline">
            Back to News
          </Link>
        </div>
      </div>
    )
  }

  const likes = news.likes || []
  const dislikes = news.dislikes || []
  const userLiked = currentUser && likes.includes(currentUser.uid)
  const userDisliked = currentUser && dislikes.includes(currentUser.uid)

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to News
        </Link>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {news.imageURL && (
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl overflow-hidden mb-8">
              <img src={news.imageURL || "/placeholder.svg"} alt={news.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="w-4 h-4" />
            <span>
              {news.date?.toDate?.()?.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) ||
                "Recently"}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-6">{news.title}</h1>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-lg text-foreground/90 leading-relaxed whitespace-pre-wrap">{news.description}</p>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-border">
            <button
              onClick={handleLike}
              disabled={!currentUser}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                userLiked
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ThumbsUp className={`w-5 h-5 ${userLiked ? "fill-current" : ""}`} />
              <span className="font-medium">{likes.length}</span>
            </button>

            <button
              onClick={handleDislike}
              disabled={!currentUser}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                userDisliked
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ThumbsDown className={`w-5 h-5 ${userDisliked ? "fill-current" : ""}`} />
              <span className="font-medium">{dislikes.length}</span>
            </button>

            {!currentUser && (
              <p className="text-sm text-muted-foreground ml-4">
                <Link to="/login" className="text-primary hover:underline">
                  Log in
                </Link>{" "}
                to like or dislike
              </p>
            )}
          </div>
        </motion.article>
      </div>
    </div>
  )
}
