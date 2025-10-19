// The actual upload will be handled by a server action

/**
 * Upload an image file via server action
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export async function uploadToImgbb(file) {
  if (!file) {
    throw new Error("No file provided for upload")
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }

  // Validate file size (imgbb free tier limit is 32MB)
  const maxSize = 32 * 1024 * 1024 // 32MB in bytes
  if (file.size > maxSize) {
    throw new Error("Image size must be less than 32MB")
  }

  try {
    console.log("[v0] Uploading image to server...")
    console.log("[v0] File name:", file.name)
    console.log("[v0] File size:", (file.size / 1024).toFixed(2), "KB")

    // Create form data
    const formData = new FormData()
    formData.append("image", file)

    // Call server API route
    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Upload error:", errorData)
      throw new Error(errorData.error || "Failed to upload image")
    }

    const data = await response.json()

    if (!data.url) {
      throw new Error("Invalid response from server")
    }

    console.log("[v0] Image uploaded successfully:", data.url)
    return data.url
  } catch (error) {
    console.error("[v0] Error uploading image:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

export async function uploadBase64ToImgbb(base64String) {
  if (!base64String) {
    throw new Error("No base64 string provided")
  }

  try {
    console.log("[v0] Uploading base64 image to server...")

    // Remove data:image prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "")

    // Call server API route
    const response = await fetch("/api/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Data }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Upload error:", errorData)
      throw new Error(errorData.error || "Failed to upload image")
    }

    const data = await response.json()

    if (!data.url) {
      throw new Error("Invalid response from server")
    }

    console.log("[v0] Base64 image uploaded successfully:", data.url)
    return data.url
  } catch (error) {
    console.error("[v0] Error uploading base64 image:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

export { uploadToImgbb as uploadImageToImgBB }
