"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon,
  Search,
  Home,
  BookOpen,
  Newspaper,
  Users,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { currentUser, userProfile, signOut, isAdmin } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const [communityEnabled, setCommunityEnabled] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (!db) {
          console.warn("[v0] Firebase not available, skipping settings fetch")
          return
        }
        const settingsQuery = query(collection(db, "settings"), where("type", "==", "general"))
        const snapshot = await getDocs(settingsQuery)
        if (!snapshot.empty) {
          const settings = snapshot.docs[0].data()
          setCommunityEnabled(settings.communityEnabled !== false)
        }
      } catch (error) {
        console.error("[v0] Error fetching settings:", error)
        // Continue with default settings
      }
    }
    fetchSettings()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setSidebarOpen(false)
      navigate("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false)
      }
    }

    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [searchOpen])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [sidebarOpen])

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Courses", path: "/courses", icon: BookOpen },
    { name: "Announcements", path: "/announcements", icon: Newspaper },
    ...(communityEnabled ? [{ name: "Community", path: "/community", icon: Users }] : []),
  ]

  return (
    <>
      <header className="sticky top-0 z-50 dark:bg-black/95 backdrop-blur-xl border-b border-border/50">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-primary/10 rounded-lg smooth-transition hover:scale-105 active:scale-95"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </button>

              <Link to="/" className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xl sm:text-2xl font-bold dark:text-white"
                >
                  Easy Education
                </motion.div>
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-2 flex-1 justify-center">
              <Link to="/" className="px-3 py-2 rounded-lg hover:bg-primary/10 smooth-transition text-sm font-medium">
                Home
              </Link>
              <Link
                to="/courses"
                className="px-3 py-2 rounded-lg hover:bg-primary/10 smooth-transition text-sm font-medium"
              >
                Courses
              </Link>
              <Link
                to="/announcements"
                className="px-3 py-2 rounded-lg hover:bg-primary/10 smooth-transition text-sm font-medium"
              >
                Announcements
              </Link>
              {communityEnabled && (
                <Link
                  to="/community"
                  className="px-3 py-2 rounded-lg hover:bg-primary/10 smooth-transition text-sm font-medium"
                >
                  Community
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 hover:bg-primary/10 rounded-lg smooth-transition hover:scale-105 active:scale-95"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-foreground" />
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-full sm:mt-2 w-auto sm:w-96 bg-card border border-primary/30 rounded-xl shadow-2xl glow-pink p-4 z-50"
                    >
                      <form onSubmit={handleSearch} className="w-full">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search courses..."
                            className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground text-sm smooth-transition"
                            autoFocus
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full mt-3 px-4 py-2 bg-gradient-pink-purple text-white rounded-lg hover:opacity-90 smooth-transition font-medium"
                        >
                          Search
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {currentUser ? (
                <Link
                  to={isAdmin ? "/admin" : "/dashboard"}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg smooth-transition text-sm font-medium hover:scale-105 active:scale-95"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:block px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg smooth-transition text-sm font-medium hover:scale-105 active:scale-95"
                >
                  Login
                </Link>
              )}

              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-primary/10 rounded-lg smooth-transition hover:scale-105 active:scale-95"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-full sm:w-80 bg-card border-r border-border z-50 overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-primary/5">
                <Link to="/" onClick={() => setSidebarOpen(false)}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-2xl font-bold text-white"
                  >
                    Easy Education
                  </motion.div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg smooth-transition hover:scale-105 active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {currentUser && (
                <div className="p-4 border-b border-border/50 bg-primary/5">
                  <div className="flex items-center gap-3">
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL || "/placeholder.svg"}
                        alt={userProfile.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/50"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-blue-purple flex items-center justify-center ring-2 ring-primary/50">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{userProfile?.name || "User"}</p>
                      <p className="text-sm text-muted-foreground truncate">{userProfile?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                      <span className="font-medium group-hover:text-primary smooth-transition">{link.name}</span>
                    </Link>
                  )
                })}
              </div>

              {currentUser && (
                <div className="p-4 border-t border-border/50 space-y-1">
                  <Link
                    to="/my-courses"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                    <span className="font-medium group-hover:text-primary smooth-transition">My Courses</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <User className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                    <span className="font-medium group-hover:text-primary smooth-transition">Profile</span>
                  </Link>
                  <Link
                    to={isAdmin ? "/admin" : "/dashboard"}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LayoutDashboard className="w-5 h-5 text-muted-foreground group-hover:text-primary smooth-transition" />
                    <span className="font-medium group-hover:text-primary smooth-transition">Dashboard</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 hover:text-destructive smooth-transition group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}

              {!currentUser && (
                <div className="p-4 border-t border-border/50 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="block w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg smooth-transition text-center font-medium hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setSidebarOpen(false)}
                    className="block w-full px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg smooth-transition text-center font-medium hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Register
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
