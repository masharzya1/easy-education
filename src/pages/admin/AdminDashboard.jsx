"use client"

import { Routes, Route, Link, useLocation } from "react-router-dom"
import { useState } from "react"
import {
  Users,
  BookOpen,
  Video,
  Newspaper,
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
} from "lucide-react"
import AdminOverview from "./AdminOverview"
import ManageUsers from "./ManageUsers"
import ManageCourses from "./ManageCourses"
import ManageClasses from "./ManageClasses"
import ManageNews from "./ManageNews"
import ManageAnnouncements from "./ManageAnnouncements"
import ManageCoupons from "./ManageCoupons"
import ManagePayments from "./ManagePayments"
import WebsiteSettings from "./WebsiteSettings"
import Rankings from "./Rankings"
import ManageCategories from "./ManageCategories"
import ManageTeachers from "./ManageTeachers"
import ManageSubjects from "./ManageSubjects"
import ManageChapters from "./ManageChapters"

export default function AdminDashboard() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Courses", path: "/admin/courses", icon: BookOpen },
    { name: "Classes", path: "/admin/classes", icon: Video },
    { name: "Subjects", path: "/admin/subjects", icon: BookMarked },
    { name: "Chapters", path: "/admin/chapters", icon: BookMarked },
    { name: "Categories", path: "/admin/categories", icon: Grid },
    { name: "Teachers", path: "/admin/teachers", icon: GraduationCap },
    { name: "News", path: "/admin/news", icon: Newspaper },
    { name: "Announcements", path: "/admin/announcements", icon: Megaphone },
    { name: "Coupons", path: "/admin/coupons", icon: Tag },
    { name: "Payments", path: "/admin/payments", icon: CreditCard },
    { name: "Settings", path: "/admin/settings", icon: Settings },
    { name: "Rankings", path: "/admin/rankings", icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border">
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div
            className={`lg:col-span-1 ${
              sidebarOpen ? "block" : "hidden"
            } lg:block fixed lg:static inset-0 lg:inset-auto z-40 lg:z-auto bg-background lg:bg-transparent`}
          >
            <div className="bg-card border border-border rounded-xl p-4 sticky top-20 lg:top-auto max-h-[calc(100vh-100px)] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 px-2">Admin Panel</h2>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="courses" element={<ManageCourses />} />
              <Route path="classes" element={<ManageClasses />} />
              <Route path="subjects" element={<ManageSubjects />} />
              <Route path="chapters" element={<ManageChapters />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="teachers" element={<ManageTeachers />} />
              <Route path="news" element={<ManageNews />} />
              <Route path="announcements" element={<ManageAnnouncements />} />
              <Route path="coupons" element={<ManageCoupons />} />
              <Route path="payments" element={<ManagePayments />} />
              <Route path="settings" element={<WebsiteSettings />} />
              <Route path="rankings" element={<Rankings />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}
