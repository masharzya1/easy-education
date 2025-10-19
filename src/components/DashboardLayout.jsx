"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, BookOpen, CreditCard, User, Home, Settings, LogOut, BarChart3 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { signOut } = useAuth()

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: Home },
    { name: "My Courses", path: "/my-courses", icon: BookOpen },
    { name: "Payment History", path: "/payment-history", icon: CreditCard },
    { name: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      setSidebarOpen(false)
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 text-white p-4 flex items-center justify-between shadow-lg">
        <h1 className="text-lg font-bold">Dashboard</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 sticky top-0 h-screen overflow-y-auto">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 text-white p-6">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-purple-100 text-sm mt-1">Student Portal</p>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 z-40 overflow-y-auto lg:hidden"
              >
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 text-white p-6">
                  <h2 className="text-2xl font-bold">Dashboard</h2>
                  <p className="text-purple-100 text-sm mt-1">Student Portal</p>
                </div>

                <nav className="p-6 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          active
                            ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto pb-24 lg:pb-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-30">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
                  active
                    ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.name.split(" ")[0]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
