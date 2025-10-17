import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Clock, Calendar } from "lucide-react"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function News() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const newsQuery = query(collection(db, "news"), orderBy("date", "desc"))
      const newsSnapshot = await getDocs(newsQuery)
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

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Latest News</h1>
          <p className="text-muted-foreground">Stay updated with the latest announcements and updates</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/news/${item.id}`}>
                  <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-colors group h-full">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                      {item.imageURL ? (
                        <img
                          src={item.imageURL || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Clock className="w-16 h-16 text-primary/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{item.date?.toDate?.()?.toLocaleDateString() || "Recently"}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No news available</h3>
            <p className="text-muted-foreground">Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  )
}
