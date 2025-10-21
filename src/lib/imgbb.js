/**
 * ক্লায়েন্ট-সাইড ইমেজ আপলোড হেল্পার (ImgBB API কে সার্ভারলেস ফাংশন API/upload-image এর মাধ্যমে কল করে)
 * এই লজিকটি Base64 ডেটা নিয়ে API রুটে পাঠায়, যাতে API কী লুকানো থাকে।
 */

// আপনার Vercel অ্যাপ্লিকেশনের রুট URL.
// Vercel-এ ডেপ্লয় করার পর এটি স্বয়ংক্রিয়ভাবে current host URL হবে।
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * File অবজেক্টকে Base64 string-এ রূপান্তর করে।
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * আপলোড ফাইলকে সার্ভারে পাঠায় (যা ImgBB-তে আপলোড করার জন্য সার্ভারলেস ফাংশনকে কল করে)।
 * @param {File} file - আপলোড করার জন্য ফাইল অবজেক্ট
 * @returns {Promise<string>} - আপলোড হওয়া ছবির URL
 */
export async function uploadImageToImgBB(file) {
  if (!file) {
    throw new Error("No file provided for upload"); // আপলোড করার জন্য কোনো ফাইল সরবরাহ করা হয়নি
  }
  
  // ফাইল টাইপ যাচাই
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image"); // ফাইল অবশ্যই একটি ছবি হতে হবে
  }
  
  // ফাইলের সাইজ যাচাই (32MB সর্বোচ্চ)
  const maxSize = 32 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Image size must be less than 32MB"); // ছবির সাইজ 32MB-এর কম হতে হবে
  }
  
  try {
    console.log("[Upload] Starting upload..."); // আপলোড শুরু হচ্ছে...
    
    // ফাইলকে Base64-এ রূপান্তর
    const base64 = await fileToBase64(file);
    // Base64 স্ট্রিং থেকে "data:image/jpeg;base64," অংশটি বাদ দেওয়া হলো
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    
    // সার্ভারলেস ফাংশনকে কল
    const response = await fetch(`${API_URL}/api/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Base64 ডেটা JSON বডিতে পাঠানো হলো
      body: JSON.stringify({
        // Base64 স্ট্রিংটিকে URL-এনকোড করা হলো যাতে ক্যারেক্টার ট্রান্সফারে সমস্যা না হয়
        image: encodeURIComponent(base64Data)
      }),
    });
    
    // রেসপন্স JSON ফরম্যাটে না এলে বা এরর স্ট্যাটাস এলে হ্যান্ডেল করা
    if (!response.ok) {
      // যদি response.json() ব্যর্থ হয়, তাহলে স্ট্যাটাস ও স্ট্যাটাস টেক্সট দিয়ে এরর দেখানো হবে
      let errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: `Server returned non-JSON error (Status ${response.status}): ${errorText.substring(0, 100)}...` };
      }
      
      console.error("[Upload] Server Error Response:", errorData); // সার্ভার এরর রেসপন্স:
      throw new Error(errorData.error || "Upload failed due to network or server error."); // নেটওয়ার্ক বা সার্ভার ত্রুটির কারণে আপলোড ব্যর্থ হয়েছে
    }
    
    const data = await response.json();
    
    if (!data.success || !data.url) {
      throw new Error("Invalid success response from server."); // সার্ভার থেকে অবৈধ সফল রেসপন্স
    }
    
    console.log("[Upload] Success:", data.url); // সফলতা:
    return data.url;
    
  } catch (error) {
    console.error("[Upload] Failed:", error); // ব্যর্থ হয়েছে:
    throw new Error(`Failed to upload image: ${error.message}`); // ছবি আপলোড করতে ব্যর্থ:
  }
}

/**
 * সরাসরি Base64 string দিয়ে আপলোড করার জন্য (যদি লাগে)
 */
export async function uploadBase64ToImgBB(base64String) {
  // এই ফাংশনটি এখন uploadImageToImgBB-এর মতোই প্রায় একই লজিক ব্যবহার করবে
  // সুবিধার জন্য, আপনি এটিকে সরাসরি ব্যবহার করতে পারেন যদি আপনার কাছে শুধুমাত্র Base64 স্ট্রিং থাকে
  
  if (!base64String) {
    throw new Error("No base64 string provided"); // কোনো Base64 স্ট্রিং সরবরাহ করা হয়নি
  }
  
  // Base64 স্ট্রিং থেকে "data:image/jpeg;base64," অংশটি বাদ দেওয়া হলো
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  
  if (!base64Data) {
    throw new Error("Invalid Base64 string format."); // Base64 স্ট্রিং ফরম্যাট অবৈধ
  }
  
  try {
    console.log("[Upload] Uploading raw base64 image..."); // কাঁচা Base64 ছবি আপলোড হচ্ছে...
    
    const response = await fetch(`${API_URL}/api/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: encodeURIComponent(base64Data)
      }),
    });
    
    if (!response.ok) {
      let errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: `Server returned non-JSON error (Status ${response.status}): ${errorText.substring(0, 100)}...` };
      }
      
      throw new Error(errorData.error || "Upload failed"); // আপলোড ব্যর্থ হয়েছে
    }
    
    const data = await response.json();
    
    if (!data.success || !data.url) {
      throw new Error("Invalid success response from server."); // সার্ভার থেকে অবৈধ সফল রেসপন্স
    }
    
    console.log("[Upload] Base64 upload success:", data.url); // Base64 আপলোড সফল:
    return data.url;
    
  } catch (error) {
    console.error("[Upload] Base64 upload failed:", error); // Base64 আপলোড ব্যর্থ:
    throw new Error(`Failed to upload image: ${error.message}`); // ছবি আপলোড করতে ব্যর্থ:
  }
}