/**
 * Client-side Image Upload Helper
 * Serverless function কে call করবে
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://easy-education.vercel.app'

/**
 * Upload file to server (which uploads to ImgBB)
 */
export default async function uploadImageToImgBB(file) {
  if (!file) {
    throw new Error("No file provided for upload")
  }
  
  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }
  
  // Validate file size (32MB max)
  const maxSize = 32 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error("Image size must be less than 32MB")
  }
  
  try {
    console.log("[Upload] Starting upload...")
    console.log("[Upload] File:", file.name, `(${(file.size / 1024).toFixed(2)} KB)`)
    
    // Convert file to base64
    const base64 = await fileToBase64(file)
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
    
    // Call serverless function
    const response = await fetch(`${API_URL}/api/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Data }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error("[Upload] Error:", errorData)
      throw new Error(errorData.error || "Upload failed")
    }
    
    const data = await response.json()
    
    if (!data.success || !data.url) {
      throw new Error("Invalid response from server")
    }
    
    console.log("[Upload] Success:", data.url)
    return data.url
    
  } catch (error) {
    console.error("[Upload] Failed:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Upload base64 string to server
 */
export async function uploadBase64ToImgbb(base64String) {
  if (!base64String) {
    throw new Error("No base64 string provided")
  }
  
  try {
    console.log("[Upload] Uploading base64 image...")
    
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "")
    
    const response = await fetch(`${API_URL}/api/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Data }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Upload failed")
    }
    
    const data = await response.json()
    
    if (!data.success || !data.url) {
      throw new Error("Invalid response from server")
    }
    
    console.log("[Upload] Base64 upload success:", data.url)
    return data.url
    
  } catch (error) {
    console.error("[Upload] Base64 upload failed:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Convert File to Base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}
