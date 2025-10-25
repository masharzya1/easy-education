import admin from 'firebase-admin';

let db = null;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export default async function dynamicManifestHandler(req, res) {
  try {
    let appName = "Easy Education";
    let appShortName = "EasyEdu";
    let appIcon = "/placeholder-logo.png";
    let themeColor = "#3b82f6";
    let backgroundColor = "#fcfcfd";

    if (db) {
      const settingsRef = db.collection('settings');
      const snapshot = await settingsRef.get();

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === "pwa") {
          if (data.appName) appName = data.appName;
          if (data.appShortName) appShortName = data.appShortName;
          if (data.appIcon) appIcon = data.appIcon;
          if (data.themeColor) themeColor = data.themeColor;
          if (data.backgroundColor) backgroundColor = data.backgroundColor;
        }
      });
    }

    const manifest = {
      name: appName,
      short_name: appShortName,
      description: "Learn from the best free online courses with expert teachers",
      start_url: "/",
      display: "standalone",
      background_color: backgroundColor,
      theme_color: themeColor,
      orientation: "portrait-primary",
      gcm_sender_id: "103953800507",
      icons: [
        {
          src: appIcon,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: appIcon,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      categories: ["education", "learning"],
      shortcuts: [
        {
          name: "Browse Courses",
          short_name: "Courses",
          description: "Browse all available courses",
          url: "/courses",
          icons: [
            {
              src: appIcon,
              sizes: "192x192"
            }
          ]
        },
        {
          name: "My Courses",
          short_name: "My Courses",
          description: "View your enrolled courses",
          url: "/my-courses",
          icons: [
            {
              src: appIcon,
              sizes: "192x192"
            }
          ]
        }
      ]
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(manifest);
  } catch (error) {
    console.error('Error generating manifest:', error);
    res.status(500).json({ error: 'Failed to generate manifest' });
  }
}
