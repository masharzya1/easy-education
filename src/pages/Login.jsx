import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Chrome, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function Login() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetMessage, setResetMessage] = useState("")
  const { signInWithGoogle, signInWithEmail, sendPasswordResetEmail, userProfile, currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser && userProfile) {
      console.log(" User already logged in, redirecting...")
      if (userProfile.role === "admin") {
        navigate("/admin", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    }
  }, [currentUser, userProfile, navigate])

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)

    try {
      console.log(" Attempting Google login...")
      const { profile } = await signInWithGoogle()
      console.log(" Google login successful, profile:", profile)

      setTimeout(() => {
        if (profile?.role === "admin") {
          console.log(" Redirecting to admin dashboard")
          navigate("/admin", { replace: true })
        } else {
          console.log(" Redirecting to user dashboard")
          navigate("/dashboard", { replace: true })
        }
      }, 200)
    } catch (err) {
      console.error(" Google login error:", err)
      if (err.message === "BANNED_USER") {
        setError("Your account has been banned. Please contact support.")
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.")
      } else if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups and try again.")
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Another sign-in popup is already open.")
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.")
      } else if (err.code === "auth/internal-error") {
        setError("Google Sign-in is not configured properly. Please contact support.")
      } else {
        setError(`Failed to sign in with Google: ${err.message || "Unknown error"}`)
      }
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { profile } = await signInWithEmail(email, password)
      
      setTimeout(() => {
        if (profile?.role === "admin") {
          navigate("/admin", { replace: true })
        } else {
          navigate("/dashboard", { replace: true })
        }
      }, 200)
    } catch (err) {
      if (err.message === "BANNED_USER") {
        setError("Your account has been banned. Please contact support.")
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.")
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.")
      } else {
        setError("Failed to sign in. Please try again.")
      }
      console.error(" Email login error:", err)
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setError("")
    setResetMessage("")
    setLoading(true)

    try {
      await sendPasswordResetEmail(resetEmail)
      setResetMessage("Password reset email sent! Check your inbox.")
      setResetEmail("")
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.")
      } else {
        setError("Failed to send reset email. Please try again.")
      }
      console.error(" Password reset error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (resetMode) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Reset Password
              </h1>
              <p className="text-muted-foreground">Enter your email to receive reset link</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            {resetMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setResetMode(false)
                  setError("")
                  setResetMessage("")
                }}
                className="w-full py-3 bg-muted hover:bg-muted/80 rounded-xl font-medium transition-colors"
              >
                Back to Login
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">Sign in to continue learning</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setResetMode(true)}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome className="w-5 h-5" />
            Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
