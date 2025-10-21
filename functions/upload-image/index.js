const IMGBB_API_KEY = "74ab1b5e9a3dd246d0c7745d5e33d051";

/**
 * একটি ইমেজ ফাইল সরাসরি imgBB-তে আপলোড করে (ক্লায়েন্ট-সাইড)।
 * এই ফাংশনটি কোনো সার্ভার-সাইড API কল করে না।
 * @param {File} file - আপলোড করার জন্য ইমেজ ফাইল
 * @returns {Promise<string>} - আপলোড করা ইমেজের URL
 */
export async function uploadImageToImgBB(file) {
  if (IMGBB_API_KEY === "74ab1b5e9a3dd246d0c7745d5e33d051") {
    throw new Error("অনুগ্রহ করে IMGBB API কী যোগ করুন।");
  }
  
  if (!file) {
    throw new Error("আপলোডের জন্য কোনো ফাইল দেওয়া হয়নি।");
  }
  
  // imgBB-এর জন্য ফাইলের আকার (৩২MB) এবং প্রকারভেদ যাচাই করা হচ্ছে
  if (!file.type.startsWith("image/") || file.size > 32 * 1024 * 1024) {
    throw new Error("ছবিটি অবশ্যই ইমেজ ফরম্যাট এবং ৩২MB এর কম হতে হবে।");
  }
  
  // imgBB API-এর URL তৈরি করা হচ্ছে
  const url = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
  
  try {
    // FormData ব্যবহার করে বাইনারি ডেটা তৈরি করা
    const formData = new FormData();
    // imgBB API-এর জন্য ফাইলটি 'image' নামে যুক্ত করা আবশ্যক।
    formData.append("image", file);
    
    // সরাসরি imgBB API-তে fetch কল করা হচ্ছে
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    
    // JSON ডেটা পার্স করা হচ্ছে
    const data = await response.json();
    
    if (!response.ok || !data.success || !data.data?.url) {
      // যদি imgBB থেকে কোনো ত্রুটি আসে
      const errorMessage = data.error?.message || "imgBB আপলোড করতে ব্যর্থ হয়েছে।";
      console.error("ImgBB API Response Error:", data);
      throw new Error(`Upload failed: ${errorMessage}`);
    }
    
    // সফলভাবে আপলোড হলে URL রিটার্ন করা হচ্ছে
    return data.data.url;
  } catch (error) {
    console.error("Client-Side Upload Error:", error);
    // ত্রুটিটি আপনার ManageTeachers.jsx-এর catch ব্লকে পাঠানো হচ্ছে
    throw new Error(`ছবি আপলোড ব্যর্থ: ${error.message}`);
  }
}