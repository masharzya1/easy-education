/**
 * একটি ইমেজ ফাইলকে Base64-এ রূপান্তর করে সার্ভার API-এর মাধ্যমে ImgBB-তে আপলোড করে।
 * ... (অন্যান্য সহায়ক ফাংশন একই থাকবে)
 */

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

export async function uploadImageToImgBB(file) {
  // ... (file validation logic same) ...
  if (!file) {
    throw new Error("আপলোডের জন্য কোনো ফাইল দেওয়া হয়নি।");
  }
  
  if (!file.type.startsWith("image/") || file.size > 32 * 1024 * 1024) {
    throw new Error("ছবিটি অবশ্যই ইমেজ ফরম্যাট এবং ৩২MB এর কম হতে হবে।");
  }
  
  try {
    const base64Image = await convertFileToBase64(file);
    
    const response = await fetch("/api/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });
    
    // 💡 গুরুত্বপূর্ণ সংশোধন: আগে স্ট্যাটাস চেক করুন
    if (!response.ok) {
      // যদি স্ট্যাটাস 4xx বা 5xx হয়, তাহলে JSON পার্স করার চেষ্টা করুন
      let errorBody;
      try {
        errorBody = await response.json();
        // সার্ভার যদি JSON Error পাঠায়, সেটিকে ব্যবহার করুন
        throw new Error(errorBody.error || `সার্ভার ত্রুটি: HTTP ${response.status}`);
      } catch (e) {
        // যদি সার্ভার JSON না পাঠায় (যেমন Vercel HTML Error), তবে এই ব্লক কাজ করবে
        console.error("Non-JSON Server Response Received:", await response.text());
        throw new Error(`ছবি আপলোড ব্যর্থ: সার্ভার থেকে অপ্রত্যাশিত সাড়া (HTTP ${response.status})। আপনার IMGBB কী Vercel-এ সেট করা আছে কি?`);
      }
    }
    
    // যদি response.ok হয়, তবে আমরা ধরে নেব এটি একটি JSON
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