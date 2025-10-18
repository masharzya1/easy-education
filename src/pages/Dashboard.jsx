"use client"

import { useState, useEffect } from "react"
import { Link, Navigate } from "react-router-dom"
import { motion } from "framer-motion"
import { BookOpen, ThumbsUp, Users, TrendingUp, Download, CreditCard, CheckCircle, Clock, XCircle } from "lucide-react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"

export default function Dashboard() {
  const { currentUser, userProfile, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    votesGiven: 0,
    coursesWatched: 0,
  })
  const [recentVotes, setRecentVotes] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      fetchUserStats()
    }
  }, [currentUser])

  const fetchUserStats = async () => {
    try {
      // Fetch votes given by user
      const votesQuery = query(collection(db, "votes"), where("userId", "==", currentUser.uid))
      const votesSnapshot = await getDocs(votesQuery)

      const votesData = await Promise.all(
        votesSnapshot.docs.slice(0, 5).map(async (voteDoc) => {
          const vote = voteDoc.data()
          // Fetch class info
          const classDoc = await getDocs(query(collection(db, "classes"), where("__name__", "==", vote.classId)))
          if (!classDoc.empty) {
            const classData = classDoc.docs[0].data()
            return {
              id: voteDoc.id,
              classTitle: classData.title,
              ...vote,
            }
          }
          return null
        }),
      )

      // Fetch user payments
      const paymentsQuery = query(
        collection(db, "payments"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
      )
      const paymentsSnapshot = await getDocs(paymentsQuery)
      const paymentsData = paymentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      setRecentVotes(votesData.filter(Boolean))
      setPayments(paymentsData)
      setStats({
        votesGiven: votesSnapshot.size,
        coursesWatched: paymentsData.filter((p) => p.status === "approved").length,
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateInvoice = async (payment) => {
    const html2pdf = (await import("html2pdf.js")).default

    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - Easy Education</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #1F2937; }
    .logo-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 4px solid #4F46E5; }
    .logo { width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: white; }
    .company-name { color: #4F46E5; font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .invoice-title { color: #6B7280; font-size: 16px; font-weight: 500; }
    .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
    .detail-box { padding: 20px; background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 12px; border: 1px solid #E5E7EB; }
    .detail-box p { margin: 10px 0; font-size: 14px; color: #4B5563; line-height: 1.6; }
    .detail-box strong { color: #111827; font-weight: 600; }
    .item-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
    .item-table th { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 16px; text-align: left; font-weight: 600; font-size: 14px; }
    .item-table td { border: 1px solid #E5E7EB; padding: 16px; background: white; }
    .item-table tbody tr:nth-child(even) { background-color: #F9FAFB; }
    .total-section { text-align: right; padding: 24px; background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border-radius: 12px; border: 2px solid #4F46E5; margin-bottom: 30px; }
    .total-section .subtotal { font-size: 15px; color: #6B7280; margin-bottom: 12px; }
    .total-section .total { font-size: 28px; font-weight: 800; color: #4F46E5; margin-top: 8px; }
    .status { display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .status-approved { background-color: #D1FAE5; color: #065F46; }
    .status-pending { background-color: #FEF3C7; color: #92400E; }
    .status-rejected { background-color: #FEE2E2; color: #991B1B; }
    .terms-section { padding: 20px; background: #FFF7ED; border-left: 4px solid #F59E0B; border-radius: 8px; margin-bottom: 30px; }
    .terms-section h3 { color: #92400E; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .terms-section p { color: #78350F; font-size: 12px; line-height: 1.6; margin: 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 2px solid #E5E7EB; }
    .footer-logo { color: #4F46E5; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .footer p { color: #6B7280; font-size: 12px; margin: 4px 0; }
    .footer a { color: #4F46E5; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>
  <div class="logo-header">
    <div class="logo">EE</div>
    <div class="company-name">Easy Education</div>
    <p class="invoice-title">Invoice #${payment.id.substring(0, 8).toUpperCase()}</p>
  </div>
  <div class="invoice-details">
    <div class="detail-box">
      <p><strong>Student Name:</strong> ${payment.userName || "N/A"}</p>
      <p><strong>Email:</strong> ${payment.userEmail || "N/A"}</p>
      <p><strong>Date:</strong> ${payment.submittedAt?.toDate?.()?.toLocaleDateString() || payment.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</p>
    </div>
    <div class="detail-box">
      <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
      <p><strong>Sender Number:</strong> ${payment.senderNumber}</p>
      <p><strong>Status:</strong> <span class="status status-${payment.status}">${payment.status?.toUpperCase()}</span></p>
    </div>
  </div>
  <table class="item-table">
    <thead>
      <tr>
        <th>Course</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${
        payment.courses
          ?.map(
            (course) => `
        <tr>
          <td>${course.title}</td>
          <td style="text-align: right;">৳${course.price || 0}</td>
        </tr>
      `,
          )
          .join("") ||
        `<tr><td>${payment.courseName || "Course"}</td><td style="text-align: right;">৳${payment.amount || 0}</td></tr>`
      }
    </tbody>
  </table>
  ${
    payment.couponCode
      ? `
    <div style="margin-bottom: 20px; padding: 12px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400E;"><strong>Coupon Applied:</strong> ${payment.couponCode} (${payment.discountPercent}% off)</p>
    </div>
  `
      : ""
  }
  <div class="total-section">
    ${payment.couponCode ? `<p class="subtotal">Subtotal: ৳${payment.courses?.reduce((sum, c) => sum + (c.price || 0), 0) || payment.amount || 0}</p>` : ""}
    <p class="total">Total: ৳${payment.finalAmount || payment.amount || 0}</p>
  </div>
  <div class="terms-section">
    <h3>Payment Terms & Conditions</h3>
    <p>• All payments are final and non-refundable once approved.<br>
    • Course access is granted upon payment approval by our admin team.<br>
    • For any issues or questions, please contact our support team.<br>
    • This invoice is computer-generated and does not require a signature.</p>
  </div>
  <div class="footer">
    <div class="footer-logo">Easy Education</div>
    <p>Thank you for choosing Easy Education!</p>
    <p>For support: <a href="mailto:support@easyeducation.com">support@easyeducation.com</a></p>
    <p style="margin-top: 12px; font-size: 11px; color: #9CA3AF;">© 2025 Easy Education. All rights reserved.</p>
  </div>
</body>
</html>
    `

    const element = document.createElement("div")
    element.innerHTML = invoiceHTML

    const options = {
      margin: 10,
      filename: `invoice-${payment.id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }

    html2pdf().set(options).from(element).save()
  }

  const getStatusIcon = (status) => {
    if (status === "approved") return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status === "pending") return <Clock className="w-5 h-5 text-yellow-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusBadge = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status?.toUpperCase()}
      </span>
    )
  }

  const statCards = [
    {
      title: "Votes Given",
      value: stats.votesGiven,
      icon: ThumbsUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Courses Watched",
      value: stats.coursesWatched,
      icon: BookOpen,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Member Since",
      value:
        userProfile?.createdAt?.toDate?.()?.toLocaleDateString("en-US", { month: "short", year: "numeric" }) ||
        "Recently",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ]

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {userProfile?.name || "Student"}!</h1>
          <p className="text-muted-foreground">Here's your learning overview</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          {/* Payments & Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">My Payments</h2>
              </div>
              <Link
                to="/payment-history"
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View All
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="p-4 bg-background border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(payment.status)}
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{payment.courseName || "Course"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Amount: ৳{payment.finalAmount || payment.amount || "0.00"} • Transaction:{" "}
                            {payment.transactionId}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {payment.submittedAt?.toDate?.()?.toLocaleDateString() ||
                              payment.createdAt?.toDate?.()?.toLocaleDateString() ||
                              "Recently"}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    {payment.status === "approved" && (
                      <button
                        onClick={() => generateInvoice(payment)}
                        className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Invoice
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No payments yet. Purchase a course to get started!</p>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Votes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Recent Votes</h2>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : recentVotes.length > 0 ? (
                <div className="space-y-3">
                  {recentVotes.map((vote) => (
                    <div key={vote.id} className="p-3 bg-background rounded-lg">
                      <p className="text-sm font-medium line-clamp-1">{vote.classTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {vote.timestamp?.toDate?.()?.toLocaleDateString() || "Recently"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ThumbsUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No votes yet. Start watching courses!</p>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Quick Actions</h2>
              </div>

              <div className="space-y-3">
                <Link
                  to="/courses"
                  className="block p-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-primary mb-1">Browse Courses</h3>
                  <p className="text-sm text-muted-foreground">Explore our course library</p>
                </Link>

                <Link
                  to="/my-courses"
                  className="block p-4 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-secondary mb-1">My Courses</h3>
                  <p className="text-sm text-muted-foreground">View your purchased courses and progress</p>
                </Link>

                <Link
                  to="/community"
                  className="block p-4 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-secondary mb-1">Join Community</h3>
                  <p className="text-sm text-muted-foreground">Connect with other learners</p>
                </Link>

                <Link
                  to="/profile"
                  className="block p-4 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-accent mb-1">Edit Profile</h3>
                  <p className="text-sm text-muted-foreground">Update your information</p>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
