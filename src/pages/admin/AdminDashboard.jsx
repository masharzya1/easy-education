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
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed lg:static inset-0 lg:inset-auto z-40 lg:z-auto bg-background lg:bg-transparent transition-all duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } w-64 lg:w-72`}
        >
          <div className="bg-card border-r border-border h-screen overflow-y-auto sticky top-0">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl font-bold mb-6 px-2">Admin Panel</h2>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate text-sm font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto">
          <div className="p-4 sm:p-6 lg:p-8">
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
