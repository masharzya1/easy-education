import { useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function SettingsLoader() {
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = collection(db, "settings")
        const snapshot = await getDocs(settingsRef)

        let appName = "Easy Education"
        let appIcon = null
        let themeColor = "#3b82f6"
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.type === "pwa") {
            if (data.appName) appName = data.appName
            if (data.appIcon) appIcon = data.appIcon
            if (data.themeColor) themeColor = data.themeColor
          }
        })

        document.title = appName

        const themeMetaTag = document.querySelector('meta[name="theme-color"]')
        if (themeMetaTag) {
          themeMetaTag.setAttribute("content", themeColor)
        }

        if (appIcon) {
          let faviconLink = document.querySelector('link[rel="icon"]')
          if (!faviconLink) {
            faviconLink = document.createElement("link")
            faviconLink.rel = "icon"
            document.head.appendChild(faviconLink)
          }
          faviconLink.href = appIcon

          let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
          if (appleTouchIcon) {
            appleTouchIcon.href = appIcon
          }
        }

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_MANIFEST',
            appName,
            appIcon,
            themeColor
          })
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    loadSettings()
  }, [])

  return null
}
