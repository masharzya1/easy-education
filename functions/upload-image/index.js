/**
 * এই ইউটিলিটি ফাইলটি সরাসরি ImgBB API-কে কল করে।
 * ⚠️ সতর্কতা: API Key ক্লায়েন্ট-সাইড কোডে থাকবে, যা নিরাপত্তা ঝুঁকি বাড়ায়।
 * তবে যেহেতু ডিবাগার ফাইলটি কাজ করেছে, এই পদ্ধতিই আপনার জন্য কাজ করবে।
 */

// ⚠️ এখানে আপনার আসল IMGBB API Key বসান
const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY_HERE";

/**
 * একটি ফাইল নেয়, ImgBB তে আপলোড করে এবং URL ফেরত দেয়।
 * @param {File} file - আপলোড করার জন্য ফাইল অবজেক্ট।
 * @returns {Promise<string>} - আপলোড করা ছবির URL।
 */
export async function uploadImageToImgBB(file) {
  if (!file) {
    throw new Error("আপলোডের জন্য কোনো ফাইল দেওয়া হয়নি।");
  }
  
  // Vercel-এ ফাইল আপলোড সফল করতে FormData ব্যবহার করা হচ্ছে
  const formData = new FormData();
  // ImgBB API-এর জন্য 'image' ফিল্ডে ফাইলটি যোগ করা হলো
  formData.append("image", file);
  
  // ImgBB API-এর সম্পূর্ণ URL তৈরি করা হলো
  const url = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      // FormData ব্যবহার করার সময় Content-Type সেট করার প্রয়োজন নেই।
      body: formData,
    });
    
    if (!response.ok) {
      let errorDetails = `HTTP ${response.status}.`;
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
      } catch (e) {
        // যদি ImgBB JSON এরর না পাঠায়
        console.error("Non-JSON error from ImgBB:", await response.text());
      }
      throw new Error(`আপলোড ব্যর্থ হয়েছে: ${errorDetails}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data?.url) {
      throw new Error("ImgBB থেকে সঠিক URL পাওয়া যায়নি।");
    }
    
    return data.data.url;
  } catch (error) {
    console.error("Error during direct ImgBB upload:", error);
    throw new Error(`ছবি আপলোড ব্যর্থ: ${error.message}`);
  }
}