"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Shield, ShieldOff, Trash2, Ban } from "lucide-react"
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import { db } from "../../lib/firebase"

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [courses, setCourses] = useState([])
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState("")

  useEffect(() => {
    fetchUsers()
    fetchCourses()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery])

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, "courses"))
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handlePromoteToAdmin = async (userId) => {
    try {
      console.log(" Promoting user to admin:", userId)
      await updateDoc(doc(db, "users", userId), { isAdmin: true })
      setUsers(users.map((u) => (u.id === userId ? { ...u, isAdmin: true } : u)))
      showSuccess("User promoted to admin successfully!")
      console.log(" User promoted successfully")
    } catch (error) {
      console.error(" Error promoting user:", error)
      alert(`Failed to promote user: ${error.message}`)
    }
  }

  const handleDemoteToUser = async (userId) => {
    try {
      console.log(" Demoting user to regular user:", userId)
      await updateDoc(doc(db, "users", userId), { isAdmin: false })
      setUsers(users.map((u) => (u.id === userId ? { ...u, isAdmin: false } : u)))
      showSuccess("User demoted to regular user successfully!")
      console.log(" User demoted successfully")
    } catch (error) {
      console.error(" Error demoting user:", error)
      alert(`Failed to demote user: ${error.message}`)
    }
  }

  const handleBanUser = async (userId, currentBanStatus) => {
    try {
      console.log(" Toggling ban status for user:", userId, "Current status:", currentBanStatus)
      await updateDoc(doc(db, "users", userId), { banned: !currentBanStatus })
      setUsers(users.map((u) => (u.id === userId ? { ...u, banned: !currentBanStatus } : u)))
      showSuccess(!currentBanStatus ? "User banned successfully!" : "User unbanned successfully!")
      console.log(" Ban status updated successfully")
    } catch (error) {
      console.error(" Error banning user:", error)
      alert(`Failed to ban/unban user: ${error.message}`)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      console.log(" Deleting user:", userId)
      await deleteDoc(doc(db, "users", userId))
      setUsers(users.filter((u) => u.id !== userId))
      showSuccess("User deleted successfully!")
      console.log(" User deleted successfully")
    } catch (error) {
      console.error(" Error deleting user:", error)
      alert(`Failed to delete user: ${error.message}`)
    }
  }

  const handleRemoveFromCourse = async () => {
    if (!selectedUser || !selectedCourse) {
      alert("Please select both user and course")
      return
    }

    if (!confirm("Are you sure you want to remove this student from the course?")) return

    try {
      console.log("[v0] Removing user from course:", selectedUser.id, selectedCourse)

      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", selectedUser.id),
        where("status", "==", "approved"),
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)

      for (const paymentDoc of paymentsSnapshot.docs) {
        const payment = paymentDoc.data()
        const updatedCourses = payment.courses?.filter((c) => c.id !== selectedCourse) || []

        await updateDoc(doc(db, "payments", paymentDoc.id), {
          courses: updatedCourses,
        })
      }

      showSuccess("Student removed from course successfully!")
      setShowRemoveModal(false)
      setSelectedUser(null)
      setSelectedCourse("")
      fetchUsers()
    } catch (error) {
      console.error("[v0] Error removing student from course:", error)
      alert(`Failed to remove student: ${error.message}`)
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
        <p className="text-muted-foreground">View and manage all platform users</p>
      </motion.div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm"
        >
          {successMessage}
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                    User
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Role
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL || "/placeholder.svg"}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-semibold text-xs sm:text-sm">
                              {user.name?.[0] || "U"}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                      <span className="truncate block max-w-[150px] sm:max-w-none">{user.email}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                          user.isAdmin ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                        }`}
                      >
                        {user.isAdmin ? "admin" : "user"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                          user.banned
                            ? "bg-red-500/10 text-red-500"
                            : user.online
                              ? "bg-green-500/10 text-green-500"
                              : "bg-muted-foreground/10 text-muted-foreground"
                        }`}
                      >
                        {user.banned ? "Banned" : user.online ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {user.isAdmin ? (
                          <button
                            onClick={() => handleDemoteToUser(user.id)}
                            className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Demote to User"
                          >
                            <ShieldOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromoteToAdmin(user.id)}
                            className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Promote to Admin"
                          >
                            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                          </button>
                        )}
                        <button
                          onClick={() => handleBanUser(user.id, user.banned)}
                          className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
                          title={user.banned ? "Unban User" : "Ban User"}
                        >
                          <Ban
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${user.banned ? "text-green-500" : "text-yellow-500"}`}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowRemoveModal(true)
                          }}
                          className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Remove from Course"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {showRemoveModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4">Remove Student from Course</h2>
            <p className="text-muted-foreground mb-6">
              Select a course to remove <strong>{selectedUser?.name}</strong> from:
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRemoveFromCourse}
                disabled={!selectedCourse}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                Remove
              </button>
              <button
                onClick={() => {
                  setShowRemoveModal(false)
                  setSelectedUser(null)
                  setSelectedCourse("")
                }}
                className="flex-1 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
