"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Settings, Save, AlertCircle, Bell, BellOff, CheckCircle } from "lucide-react"
import { collection, getDocs, query, where, updateDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../lib/firebase"
import { saveAdminFCMToken } from "../../lib/notifications"
import { requestNotificationPermission } from "../../lib/pwa"

export default function WebsiteSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [notificationStatus, setNotificationStatus] = useState('default')
  const [enablingNotifications, setEnablingNotifications] = useState(false)

  const [settings, setSettings] = useState({
    communityEnabled: true,
    paymentInstructions: "Please pay to 018XXXXXXXX via bKash",
    siteName: "Easy Education",
    siteDescription: "Learn from the best educators",
  })

  useEffect(() => {
    fetchSettings()
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = () => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission)
    }
  }

  const handleEnableNotifications = async () => {
    setEnablingNotifications(true)
    setErrorMessage("")
    
    try {
      const permission = await requestNotificationPermission()
      
      if (!permission) {
        setErrorMessage("Notification permission denied. Please enable notifications in your browser settings.")
        setNotificationStatus('denied')
        return
      }

      const userId = auth.currentUser?.uid
      if (!userId) {
        setErrorMessage("You must be logged in to enable notifications")
        return
      }

      const token = await saveAdminFCMToken(userId)
      
      if (token) {
        setSuccessMessage("Push notifications enabled successfully!")
        setNotificationStatus('granted')
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setErrorMessage("Failed to get notification token. Please try again.")
      }
    } catch (error) {
      console.error("Error enabling notifications:", error)
      setErrorMessage("Failed to enable notifications. Check console for details.")
    } finally {
      setEnablingNotifications(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const settingsRef = collection(db, "settings")
      const snapshot = await getDocs(settingsRef)

      if (!snapshot.empty) {
        const settingsData = {}
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.type === "general") {
            settingsData.siteName = data.siteName || "Easy Education"
            settingsData.siteDescription = data.siteDescription || "Learn from the best educators"
            settingsData.communityEnabled = data.communityEnabled !== false
          } else if (data.type === "payment") {
            settingsData.paymentInstructions = data.instructions || "Please pay to 018XXXXXXXX via bKash"
          }
        })
        setSettings((prev) => ({ ...prev, ...settingsData }))
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setErrorMessage("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const generalSettingsRef = query(collection(db, "settings"), where("type", "==", "general"))
      const generalSnapshot = await getDocs(generalSettingsRef)

      const generalData = {
        type: "general",
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        communityEnabled: settings.communityEnabled,
        updatedAt: serverTimestamp(),
      }

      if (!generalSnapshot.empty) {
        await updateDoc(doc(db, "settings", generalSnapshot.docs[0].id), generalData)
      } else {
        await setDoc(doc(collection(db, "settings")), generalData)
      }

      const paymentSettingsRef = query(collection(db, "settings"), where("type", "==", "payment"))
      const paymentSnapshot = await getDocs(paymentSettingsRef)

      const paymentData = {
        type: "payment",
        instructions: settings.paymentInstructions,
        updatedAt: serverTimestamp(),
      }

      if (!paymentSnapshot.empty) {
        await updateDoc(doc(db, "settings", paymentSnapshot.docs[0].id), paymentData)
      } else {
        await setDoc(doc(collection(db, "settings")), paymentData)
      }

      setSuccessMessage("Settings saved successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setErrorMessage("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          Website Settings
        </h1>
        <p className="text-muted-foreground">Configure your platform settings</p>
      </motion.div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {successMessage}
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* General Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium">Community Page</h3>
                <p className="text-sm text-muted-foreground">Enable or disable the community page for users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.communityEnabled}
                  onChange={(e) => setSettings({ ...settings, communityEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-start gap-3 mb-3">
                {notificationStatus === 'granted' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : notificationStatus === 'denied' ? (
                  <BellOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Bell className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Admin Notifications</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enable push notifications to receive alerts for new payments, user registrations, and important updates
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium">Status:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      notificationStatus === 'granted' 
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                        : notificationStatus === 'denied'
                        ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                        : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                    }`}>
                      {notificationStatus === 'granted' ? 'Enabled' : notificationStatus === 'denied' ? 'Blocked' : 'Not enabled'}
                    </span>
                  </div>
                  {notificationStatus !== 'granted' && (
                    <button
                      onClick={handleEnableNotifications}
                      disabled={enablingNotifications}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      {enablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                    </button>
                  )}
                  {notificationStatus === 'granted' && (
                    <p className="text-xs text-green-600 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      You'll receive push notifications for important updates
                    </p>
                  )}
                </div>
              </div>
              {notificationStatus === 'denied' && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-600">
                    <strong>Notifications blocked:</strong> To enable notifications, please allow them in your browser settings for this site.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Instructions</label>
            <textarea
              value={settings.paymentInstructions}
              onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
              rows={4}
              placeholder="Enter payment instructions for users..."
              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              These instructions will be displayed on the checkout page
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t border-border pt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 font-medium smooth-transition"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}
