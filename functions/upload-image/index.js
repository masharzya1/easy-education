/**
 * একটি ইমেজ ফাইলকে Base64-এ রূপান্তর করে সার্ভার API-এর মাধ্যমে ImgBB-তে আপলোড করে।
 * @param {File} file - আপলোড করার জন্য ইমেজ ফাইল
 * @returns {Promise<string>} - আপলোড করা ইমেজের URL
 */

// ফাইলকে Base64 স্ট্রিং-এ রূপান্তর করার জন্য সহায়ক ফাংশন
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // "data:image/jpeg;base64," অংশটি বাদ দিতে হবে, শুধুমাত্র Base64 স্ট্রিং পাঠাতে হবে
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

export async function uploadImageToImgBB(file) {
  if (!file) {
    throw new Error("আপলোডের জন্য কোনো ফাইল দেওয়া হয়নি।");
  }
  
  // ফাইলের আকার (৩২MB) এবং প্রকারভেদ যাচাই করা হচ্ছে
  if (!file.type.startsWith("image/") || file.size > 32 * 1024 * 1024) {
    throw new Error("ছবিটি অবশ্যই ইমেজ ফরম্যাট এবং ৩২MB এর কম হতে হবে।");
  }
  
  try {
    // 1. ফাইলকে Base64 স্ট্রিং-এ রূপান্তর করা
    const base64Image = await convertFileToBase64(file);
    
    // 2. সার্ভার API-তে JSON বডিতে Base64 ডেটা POST করা
    const response = await fetch("/api/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // JSON বডি ব্যবহারের জন্য এই হেডারটি প্রয়োজন
      },
      body: JSON.stringify({ image: base64Image }), // Base64 স্ট্রিং পাঠানো হচ্ছে
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || "সার্ভার থেকে ছবি আপলোড ব্যর্থ হয়েছে।";
      console.error("Upload Failed by Server:", errorData);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data.url) {
      throw new Error("ImgBB থেকে সঠিক URL পাওয়া যায়নি।");
    }
    
    return data.url;
  } catch (error) {
    console.error("Error in Client-Side Upload Utility:", error);
    throw new Error(`ছবি আপলোড ব্যর্থ: ${error.message}`);
  }
}