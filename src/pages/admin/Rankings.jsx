import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Trophy, TrendingUp, User, Award, Star, Crown, BookOpen } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../lib/firebase"

export default function Rankings() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      console.log(" Fetching rankings data...")

      const classesSnapshot = await getDocs(collection(db, "classes"))
      const classesData = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      console.log(" Classes fetched:", classesData.length)

      const teacherVotes = {}

      classesData.forEach((cls) => {
        const teacherName = cls.teacherName

        if (!teacherName || teacherName.trim() === "") {
          return
        }

        if (!teacherVotes[teacherName]) {
          teacherVotes[teacherName] = {
            name: teacherName,
            totalLikes: 0,
            totalDislikes: 0,
            netScore: 0,
            classesCount: 0,
            teacherImageURL: cls.teacherImageURL || null,
          }
        }

        const likes = cls.likesCount || 0
        const dislikes = cls.dislikesCount || 0

        teacherVotes[teacherName].totalLikes += likes
        teacherVotes[teacherName].totalDislikes += dislikes
        teacherVotes[teacherName].netScore += likes - dislikes
        teacherVotes[teacherName].classesCount += 1

        if (!teacherVotes[teacherName].teacherImageURL && cls.teacherImageURL) {
          teacherVotes[teacherName].teacherImageURL = cls.teacherImageURL
        }
      })

      console.log(" Teachers aggregated:", Object.keys(teacherVotes).length)

      const rankingsArray = Object.values(teacherVotes).sort((a, b) => b.netScore - a.netScore)

      console.log(" Rankings sorted:", rankingsArray)
      setRankings(rankingsArray)
    } catch (error) {
      console.error(" Error fetching rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (index) => {
    if (index === 0) {
      return (
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-background">
            1
          </div>
        </div>
      )
    } else if (index === 1) {
      return (
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-background">
            2
          </div>
        </div>
      )
    } else if (index === 2) {
      return (
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
            <Star className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-background">
            3
          </div>
        </div>
      )
    } else {
      return (
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-md">
          <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
        </div>
      )
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          Teacher Rankings
        </h1>
        <p className="text-muted-foreground">Top teachers ranked by student reactions (likes - dislikes)</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : rankings.length > 0 ? (
        <div className="space-y-6">
          {rankings.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {rankings.slice(0, 3).map((teacher, index) => (
                <motion.div
                  key={teacher.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative overflow-hidden rounded-2xl p-6 ${
                    index === 0
                      ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50"
                      : index === 1
                        ? "bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50"
                        : "bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500/50"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    {getRankBadge(index)}

                    {teacher.teacherImageURL ? (
                      <img
                        src={teacher.teacherImageURL || "/placeholder.svg"}
                        alt={teacher.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-xl mt-4"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-xl mt-4">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}

                    <h3 className="text-xl font-bold mt-4 mb-2">{teacher.name}</h3>

                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span className="text-muted-foreground">{teacher.classesCount} classes</span>
                    </div>

                    <div className="flex items-center gap-4 justify-center w-full">
                      <div className="flex items-center gap-1 text-green-500">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">{teacher.totalLikes}</span>
                      </div>
                      <div className="w-px h-4 bg-border"></div>
                      <div className="flex items-center gap-1 text-red-500">
                        <TrendingUp className="w-4 h-4 rotate-180" />
                        <span className="font-bold">{teacher.totalDislikes}</span>
                      </div>
                    </div>

                    <div className="mt-4 px-4 py-2 bg-primary/20 rounded-full">
                      <span className="text-lg font-bold text-primary">Score: {teacher.netScore}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {rankings.length > 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Other Top Teachers
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rankings.slice(3).map((teacher, index) => (
                  <motion.div
                    key={teacher.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (index + 3) * 0.05 }}
                    className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-lg"></div>
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-lg border-2 border-border">
                          <span className="text-2xl font-bold text-foreground">#{index + 4}</span>
                        </div>
                      </div>

                      {teacher.teacherImageURL ? (
                        <img
                          src={teacher.teacherImageURL || "/placeholder.svg"}
                          alt={teacher.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-xl mb-4"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-background shadow-xl mb-4">
                          <User className="w-12 h-12 text-primary" />
                        </div>
                      )}

                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{teacher.name}</h3>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <BookOpen className="w-4 h-4" />
                        <span>{teacher.classesCount} classes</span>
                      </div>

                      <div className="w-full bg-muted/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {teacher.totalLikes}
                            </span>
                          </div>
                          <div className="w-px h-4 bg-border"></div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                              {teacher.totalDislikes}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full px-4 py-2 border border-primary/30">
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="text-lg font-bold text-primary">{teacher.netScore}</span>
                          <span className="text-xs text-muted-foreground">score</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No rankings yet</h3>
          <p className="text-muted-foreground">Rankings will appear once classes receive reactions from students</p>
        </div>
      )}
    </div>
  )
}
