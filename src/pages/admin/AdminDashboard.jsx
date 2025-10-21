"use client"

import { Routes, Route, Link, useLocation } from "react-router-dom"
import { useState } from "react"
import {
  Users,
  BookOpen,
  Video,
  BarChart3,
  LayoutDashboard,
  Megaphone,
  Tag,
  CreditCard,
  Settings,
  Grid,
  GraduationCap,
  BookMarked,
  Menu,
  X,
  FileQuestion,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import AdminOverview from "./AdminOverview"
import ManageUsers from "./ManageUsers"
import ManageCourses from "./ManageCourses"
import ManageClasses from "./ManageClasses"
import ManageAnnouncements from "./ManageAnnouncements"
import ManageCoupons from "./ManageCoupons"
import ManagePayments from "./ManagePayments"
import WebsiteSettings from "./WebsiteSettings"
import Rankings from "./Rankings"
import ManageCategories from "./ManageCategories"
import ManageTeachers from "./ManageTeachers"
import ManageSubjects from "./ManageSubjects"
import ManageChapters from "./ManageChapters"
import ManageExams from "./ManageExams"
import ManageExamQuestions from "./ManageExamQuestions"
import ViewExamSubmissions from "./ViewExamSubmissions"

export default function AdminDashboard() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Courses", path: "/admin/courses", icon: BookOpen },
    { name: "Classes", path: "/admin/classes", icon: Video },
    { name: "Exams", path: "/admin/exams", icon: FileQuestion },
    { name: "CQ Submissions", path: "/admin/exam-submissions", icon: FileQuestion },
    { name: "Subjects", path: "/admin/subjects", icon: BookMarked },
    { name: "Chapters", path: "/admin/chapters", icon: BookMarked },
    { name: "Categories", path: "/admin/categories", icon: Grid },
    { name: "Teachers", path: "/admin/teachers", icon: GraduationCap },
    { name: "Announcements", path: "/admin/announcements", icon: Megaphone },
    { name: "Coupons", path: "/admin/coupons", icon: Tag },
    { name: "Payments", path: "/admin/payments", icon: CreditCard },
    { name: "Settings", path: "/admin/settings", icon: Settings },
    { name: "Rankings", path: "/admin/rankings", icon: BarChart3 },
  ]

  const currentPage = navItems.find((item) => item.path === location.pathname)?.name || "Admin Panel"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Header - Compact */}
      <div className="hidden lg:block border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground font-medium">{currentPage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground font-medium">{currentPage}</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Compact */}
        <div className="hidden lg:flex flex-col w-56 bg-card border-r border-border overflow-y-auto">
          <div className="p-3">
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 text-xs ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-medium"
                        : "hover:bg-muted text-foreground hover:text-primary font-normal"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="p-3 sm:p-4 lg:p-4">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="courses" element={<ManageCourses />} />
              <Route path="classes" element={<ManageClasses />} />
              <Route path="exams" element={<ManageExams />} />
              <Route path="exams/:examId/questions" element={<ManageExamQuestions />} />
              <Route path="exam-submissions" element={<ViewExamSubmissions />} />
              <Route path="subjects" element={<ManageSubjects />} />
              <Route path="chapters" element={<ManageChapters />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="teachers" element={<ManageTeachers />} />
              <Route path="announcements" element={<ManageAnnouncements />} />
              <Route path="coupons" element={<ManageCoupons />} />
              <Route path="payments" element={<ManagePayments />} />
              <Route path="settings" element={<WebsiteSettings />} />
              <Route path="rankings" element={<Rankings />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 rounded-t-2xl max-h-[80vh] overflow-y-auto lg:hidden"
            >
              <div className="flex justify-center pt-2 pb-4">
                <div className="w-12 h-1 bg-muted rounded-full" />
              </div>
              <div className="px-4 pb-6">
                <h2 className="text-lg font-bold mb-4">Admin Menu</h2>
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                            : "hover:bg-muted text-foreground hover:text-primary"
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
