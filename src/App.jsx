import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import { ExamProvider } from "./contexts/ExamContext"
import { Toaster } from "./components/ui/toaster"
import Header from "./components/Header"
import Footer from "./components/Footer"
import CartDrawer from "./components/CartDrawer"
import FloatingCartButton from "./components/FloatingCartButton"
import ProtectedRoute from "./components/ProtectedRoute"
import PWAInstallPrompt from "./components/PWAInstallPrompt"

// Pages
import Home from "./pages/Home"
import Login from "./pages/Login"
import Courses from "./pages/Courses"
import CourseDetail from "./pages/CourseDetail"
import CourseChapters from "./pages/CourseChapters"
import CourseSubjects from "./pages/CourseSubjects"
import CourseClasses from "./pages/CourseClasses"
import CourseWatch from "./pages/CourseWatch"
import Announcements from "./pages/Announcments"
import AnnouncementDetail from "./pages/AnnouncementDetail"
import Community from "./pages/Community"
import Profile from "./pages/Profile"
import Dashboard from "./pages/Dashboard"
import AdminDashboard from "./pages/admin/AdminDashboard"
import Checkout from "./pages/Checkout"
import CheckoutComplete from "./pages/CheckoutComplete"
import PaymentHistory from "./pages/PaymentHistory"
import MyCourses from "./pages/MyCourses"
import ExamView from "./pages/ExamView"

console.log("[v0] App.jsx loaded")

function App() {
  console.log("[v0] App component rendering")

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ExamProvider>
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <Header />
              <main className="flex-1">
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/course/:courseId" element={<CourseDetail />} />
                <Route path="/course/:courseId/chapters" element={<CourseChapters />} />
                <Route path="/course/:courseId/subjects" element={<CourseSubjects />} />
                <Route path="/course/:courseId/subjects/:subject/chapters" element={<CourseChapters />} />
                <Route path="/course/:courseId/archive/:subject/chapters" element={<CourseChapters />} />
                <Route path="/course/:courseId/archive/:subject/:chapter/classes" element={<CourseClasses />} />
                <Route path="/course/:courseId/classes/:chapter" element={<CourseClasses />} />
                <Route path="/course/:courseId/classes/:subject/:chapter" element={<CourseClasses />} />
                <Route path="/course/:courseId/watch/:classId" element={<CourseWatch />} />
                {/* End hierarchical routes */}
                <Route path="/course/:courseId/watch" element={<CourseWatch />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout-complete" element={<CheckoutComplete />} />
                <Route
                  path="/payment-history"
                  element={
                    <ProtectedRoute>
                      <PaymentHistory />
                    </ProtectedRoute>
                  }
                />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/announcements/:id" element={<AnnouncementDetail />} />
                <Route path="/community" element={<Community />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-courses"
                  element={
                    <ProtectedRoute>
                      <MyCourses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/:examId"
                  element={
                    <ProtectedRoute>
                      <ExamView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <CartDrawer />
            <FloatingCartButton />
            <PWAInstallPrompt />
            <Toaster />
            <Footer />
          </div>
          </ExamProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
