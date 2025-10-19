import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Smartphone } from "lucide-react"

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      const dismissed = localStorage.getItem('pwaInstallDismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 30000)
      }
    }

    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = window.navigator.standalone === true
      return isStandalone || isIOSStandalone
    }

    const checkIsIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    }

    setIsIOS(checkIsIOS())

    if (checkIfInstalled()) {
      return
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if (checkIsIOS() && !checkIfInstalled()) {
      const dismissed = localStorage.getItem('pwaInstallDismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 30000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response to install prompt: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    const dismissedAt = Date.now()
    localStorage.setItem('pwaInstallDismissed', dismissedAt.toString())
    setShowPrompt(false)
  }

  useEffect(() => {
    const checkDismissal = () => {
      const lastDismissed = localStorage.getItem('pwaInstallDismissed')
      if (lastDismissed) {
        const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
        if (daysSince >= 7) {
          localStorage.removeItem('pwaInstallDismissed')
        }
      }
    }
    checkDismissal()
  }, [])

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative p-6 sm:p-8">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold mb-2">Install Easy Education</h2>
              <p className="text-muted-foreground mb-6">
                Get quick access to your courses and learn offline
              </p>

              <div className="w-full space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-left p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">✓</span>
                  </div>
                  <span>Faster access from home screen</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-left p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">✓</span>
                  </div>
                  <span>Works offline</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-left p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">✓</span>
                  </div>
                  <span>No app store required</span>
                </div>
              </div>

              {isIOS ? (
                <div className="w-full space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left">
                    <p className="text-sm font-medium mb-2">To install on iOS:</p>
                    <ol className="text-xs space-y-1 text-muted-foreground">
                      <li>1. Tap the <strong>Share</strong> button</li>
                      <li>2. Select <strong>"Add to Home Screen"</strong></li>
                      <li>3. Tap <strong>Add</strong></li>
                    </ol>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <button
                    onClick={handleInstallClick}
                    disabled={!deferredPrompt}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-5 h-5" />
                    Install Now
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium"
                  >
                    Not now
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
