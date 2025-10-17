// This keeps the API key secure on the server side

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY || process.env.VITE_IMGBB_API_KEY

    if (!IMGBB_API_KEY) {
      console.error("[v0] imgbb API key is missing")
      return res.status(500).json({
        error: "Image upload service is not configured. Please contact support.",
      })
    }

    const formData = new FormData()

    // Handle both file uploads and base64 uploads
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // File upload
      const file = req.files?.image
      if (!file) {
        return res.status(400).json({ error: "No file provided" })
      }

      formData.append("image", file.data, file.name)
    } else if (req.headers["content-type"]?.includes("application/json")) {
      // Base64 upload
      const { image } = req.body
      if (!image) {
        return res.status(400).json({ error: "No image data provided" })
      }

      formData.append("image", image)
    } else {
      return res.status(400).json({ error: "Invalid content type" })
    }

    // Upload to imgbb
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
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
      return res.status(500).json({ error: "Invalid response from imgbb" })
    }

    return res.status(200).json({ url: data.data.url })
  } catch (error) {
    console.error("[v0] Server error uploading image:", error)
    return res.status(500).json({
      error: "Failed to upload image. Please try again.",
    })
  }
}
