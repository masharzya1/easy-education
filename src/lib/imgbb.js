/**
 * Client-side Image Upload Helper
 * এই ফাইলটি Base64 ডেটা নিয়ে আপনার Vercel সার্ভারলেস ফাংশন (/api/upload-image) কে কল করে।
 * ⚠️ নিশ্চিত করুন যে আপনার /api/upload-image ফাইলে Base64 ডিকোডিং লজিক রয়েছে।
 */

// Vercel এ ডেপ্লয় করার সময় এটি স্বয়ংক্রিয়ভাবে ডোমেইন পেয়ে যাবে।
// লোকাল টেস্টের জন্য এই URL টি কাজে দেবে না, তখন VITE_API_URL সেট করতে হবে।
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Convert File to Base64 (এই ফাংশনটি ফাইলটির মধ্যেই প্রাইভেট থাকবে)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}


/**
 * 1. Upload file to server (which uploads to ImgBB)
 * এই ফাংশনটি ManageTeachers.jsx ফাইল থেকে সরাসরি কল করা হবে।
 */
export async function uploadImageToImgBB(file) { // 👈 এখানে export কীওয়ার্ড ব্যবহার করা হয়েছে
  if (!file) {
    throw new Error("No file provided for upload")
  }
  
  // File Validation
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }
  
  const maxSize = 32 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error("Image size must be less than 32MB")
  }
  
  try {
    console.log("[Upload] Starting upload...")
    
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
      // JSON Parse error এড়াতে এখানে response.text() ব্যবহার করা উচিত, যদি সার্ভার JSON না পাঠায়।
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || "Upload failed from server");
      } catch (e) {
        // যদি সার্ভার কোনো বৈধ JSON না দেয়
        throw new Error(`Server returned non-JSON error (Status ${response.status}): ${errorText.substring(0, 100)}`);
      }
    }
    
    const data = await response.json()
    
    if (!data.success || !data.url) {
      throw new Error("Invalid response from server: Success or URL missing")
    }
    
    console.log("[Upload] Success:", data.url)
    return data.url
    
  } catch (error) {
    console.error("[Upload] Failed:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * 2. Upload base64 string to server (যদি অন্য কোনো কম্পোনেন্ট শুধু base64 পাঠাতে চায়)
 */
export async function uploadBase64ToImgbb(base64String) { // 👈 এখানেও export কীওয়ার্ড ব্যবহার করা হয়েছে
  if (!base64String) {
    throw new Error("No base64 string provided")
  }
  
  // Note: এই ফাংশনটি প্রায় uploadImageToImgBB-এর মতোই, কিন্তু এটি fileToBase64 ধাপটি এড়িয়ে যায়। 
  
  // (বাকি লজিক uploadImageToImgBB-এর মতোই থাকবে)
  // ... (আপনার লজিক এখানে যুক্ত করুন) ...
  
  // কোডটি সংক্ষিপ্ত করার জন্য, আপাতত আমরা uploadImageToImgBB-এর পূর্ণ লজিকটি রেখেছি।
  // যেহেতু দুটি ফাংশনের লজিক প্রায় একই, তাই এটি ঠিক আছে।
  
  // আমরা শুধু নিশ্চিত করছি যে এখানে কোনো export default নেই।
  
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "")
  
  const response = await fetch(`${API_URL}/api/upload-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Data }),
  })
  
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.error || "Upload failed from server");
    } catch (e) {
      throw new Error(`Server returned non-JSON error (Status ${response.status}): ${errorText.substring(0, 100)}`);
    }
  }
  
  const data = await response.json()
  
  if (!data.success || !data.url) {
    throw new Error("Invalid response from server")
  }
  
  console.log("[Upload] Base64 upload success:", data.url)
  return data.url
}