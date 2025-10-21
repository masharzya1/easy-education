import fetch from "node-fetch"
import FormData from "form-data"

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    console.log("[v0] Image upload request received")

    // Get the image from request
    let imageBuffer
    let fileName = "image.jpg"

    if (req.headers["content-type"]?.includes("application/json")) {
      // Handle base64 image
      const { image } = req.body
      if (!image) {
        return res.status(400).json({ error: "No image data provided" })
      }
      imageBuffer = Buffer.from(image, "base64")
      fileName = "image.jpg"
    } else if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // Handle file upload
      const files = req.files
      if (!files || !files.image) {
        return res.status(400).json({ error: "No image file provided" })
      }
      imageBuffer = files.image.data
      fileName = files.image.name
    } else {
      return res.status(400).json({ error: "Invalid content type" })
    }

    // Validate image size (32MB limit)
    const maxSize = 32 * 1024 * 1024
    if (imageBuffer.length > maxSize) {
      return res.status(400).json({ error: "Image size exceeds 32MB limit" })
    }

    // Upload to imgbb
    const imgbbApiKey = process.env.IMGBB_API_KEY
    if (!imgbbApiKey) {
      console.error("[v0] IMGBB_API_KEY not configured")
      return res.status(500).json({ error: "Image upload service not configured" })
    }

    const formData = new FormData()
    formData.append("image", imageBuffer, fileName)
    formData.append("key", imgbbApiKey)

    console.log("[v0] Uploading to imgbb...")
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] imgbb error:", errorData)
      return res.status(response.status).json({
        error: errorData.error?.message || "Failed to upload image to imgbb",
      })
    }

    const data = await response.json()

    if (!data.success || !data.data?.url) {
      console.error("[v0] Invalid imgbb response:", data)
      return res.status(500).json({ error: "Invalid response from image service" })
    }

    console.log("[v0] Image uploaded successfully:", data.data.url)
    return res.status(200).json({
      url: data.data.url,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Image upload error:", error)
    return res.status(500).json({
      error: error.message || "Failed to upload image",
    })
  }
}
