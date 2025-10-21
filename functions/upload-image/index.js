import fetch from "node-fetch"
import FormData from "form-data"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    console.log("[v0] Image upload request received")

    let imageBuffer
    let fileName = "image.jpg"

    if (req.headers["content-type"]?.includes("application/json")) {
      const { image } = req.body
      if (!image) {
        return res.status(400).json({ error: "No image data provided" })
      }
      imageBuffer = Buffer.from(image, "base64")
      fileName = "image.jpg"
    } else if (req.headers["content-type"]?.includes("multipart/form-data")) {
      const files = req.files
      if (!files || !files.image) {
        return res.status(400).json({ error: "No image file provided" })
      }
      imageBuffer = files.image.data
      fileName = files.image.name
    } else {
      return res.status(400).json({ error: "Invalid content type" })
    }

    const maxSize = 32 * 1024 * 1024
    if (imageBuffer.length > maxSize) {
      return res.status(400).json({ error: "Image size exceeds 32MB limit" })
    }

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
      headers: formData.getHeaders(),
    })

    const responseText = await response.text()
    console.log("[v0] imgbb response status:", response.status)
    console.log("[v0] imgbb response text:", responseText)

    if (!response.ok) {
      console.error("[v0] imgbb error response:", responseText)
      try {
        const errorData = JSON.parse(responseText)
        return res.status(response.status).json({
          error: errorData.error?.message || "Failed to upload image to imgbb",
        })
      } catch {
        return res.status(response.status).json({
          error: "Failed to upload image to imgbb",
        })
      }
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[v0] Failed to parse imgbb response:", parseError)
      console.error("[v0] Response text was:", responseText)
      return res.status(500).json({ error: "Invalid response format from image service" })
    }

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
