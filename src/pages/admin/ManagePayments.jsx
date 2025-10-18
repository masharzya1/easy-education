"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CreditCard, Check, X, Clock } from "lucide-react"
import { collection, getDocs, updateDoc, doc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { db } from "../../lib/firebase"

export default function ManagePayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, pending, approved, rejected

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const q = query(collection(db, "payments"), orderBy("submittedAt", "desc"))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setPayments(data)
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (payment) => {
    if (!confirm("Approve this payment and grant course access?")) return

    try {
      await updateDoc(doc(db, "payments", payment.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
      })

      // Grant access to each course by creating userCourses entries
      for (const course of payment.courses) {
        await setDoc(doc(db, "userCourses", `${payment.userId}_${course.id}`), {
          userId: payment.userId,
          courseId: course.id,
          enrolledAt: serverTimestamp(),
          progress: 0,
        })
      }

      alert("Payment approved and course access granted!")
      fetchPayments()
    } catch (error) {
      console.error("Error approving payment:", error)
      alert("Failed to approve payment")
    }
  }

  const handleReject = async (paymentId) => {
    const reason = prompt("Enter rejection reason (optional):")

    try {
      await updateDoc(doc(db, "payments", paymentId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || "Payment verification failed",
      })

      alert("Payment rejected successfully!")
      fetchPayments()
    } catch (error) {
      console.error("Error rejecting payment:", error)
      alert("Failed to reject payment")
    }
  }

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true
    return payment.status === filter
  })

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-600 border-green-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
    }
    const icons = {
      pending: Clock,
      approved: Check,
      rejected: X,
    }
    const Icon = icons[status] || Clock

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || styles.pending} flex items-center gap-1 w-fit`}
      >
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-primary" />
          Manage Payments
        </h1>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                filter === status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {status} ({payments.filter((p) => status === "all" || p.status === status).length})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredPayments.map((payment) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{payment.userName}</h3>
                    <p className="text-sm text-muted-foreground">{payment.userEmail}</p>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sender Number</p>
                    <p className="font-medium">{payment.senderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                    <p className="font-medium font-mono">{payment.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Submitted At</p>
                    <p className="font-medium">{payment.submittedAt?.toDate?.()?.toLocaleString() || "Recently"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="font-bold text-primary text-lg">৳{payment.finalAmount}</p>
                    {payment.couponCode && (
                      <p className="text-xs text-green-600">
                        Coupon: {payment.couponCode} (-{payment.discountPercent}%)
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Courses ({payment.courses?.length || 0})</p>
                  <div className="space-y-1">
                    {payment.courses?.map((course, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{course.title}</span>
                        <span className="text-muted-foreground">৳{course.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {payment.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-600">
                      <strong>Rejection Reason:</strong> {payment.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {payment.status === "pending" && (
                <div className="flex flex-col gap-2 md:w-40">
                  <button
                    onClick={() => handleApprove(payment)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(payment.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No {filter !== "all" && filter} payments found</p>
        </div>
      )}
    </div>
  )
}
