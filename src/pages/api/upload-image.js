// Vercel/Next.js-এর জন্য কোনো অতিরিক্ত 'config' বা 'formidable' প্রয়োজন নেই।

export default async function handler(req, res) {
  // Global catch-all error handling
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "শুধুমাত্র POST মেথড অনুমোদিত।" });
    }
    
    // --- API KEY VALIDATION ---
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
    
    if (!IMGBB_API_KEY) {
      console.error("CRITICAL: IMGBB_API_KEY Missing from environment variables.");
      // ক্লায়েন্টকে JSON এরর পাঠানো হচ্ছে
      return res.status(500).json({ error: "সার্ভার কনফিগারেশনে ত্রুটি। IMGBB API Key খুঁজে পাওয়া যায়নি। Vercel এ এটি সেট করুন।" });
    }
    
    // --- REQUEST BODY VALIDATION ---
    const { image: base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: "ইমেজের Base64 ডেটা খুঁজে পাওয়া যায়নি। এটি খালি ছিল।" });
    }
    
    // --- IMGBB UPLOAD ---
    const formData = new FormData();
    formData.append("image", base64Image);
    
    const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });
    
    if (!imgbbResponse.ok) {
      // ImgBB থেকে আসা এরর JSON হলে সেটি ক্লায়েন্টের কাছে পাঠানো
      try {
        const errorData = await imgbbResponse.json();
        return res.status(imgbbResponse.status).json({
          error: errorData.error?.message || "ImgBB আপলোড করতে ব্যর্থ হয়েছে (অজানা ত্রুটি)।",
        });
      } catch (e) {
        // ImgBB থেকে আসা সাড়া JSON না হলে (খুব বিরল)
        console.error("ImgBB returned non-JSON error:", await imgbbResponse.text());
        return res.status(502).json({ error: "ImgBB থেকে অপ্রত্যাশিত সাড়া (Non-JSON) পাওয়া গেছে।" });
      }
    }
    
    const data = await imgbbResponse.json();
    
    if (!data.success || !data.data?.url) {
      return res.status(500).json({ error: "ImgBB থেকে সফল সাড়া পাওয়া যায়নি।" });
    }
    
    // --- SUCCESS RESPONSE ---
    return res.status(200).json({ url: data.data.url });
    
  } catch (error) {
    // এই ক্যাচ ব্লকটি সার্ভারলেস ফাংশনের ভেতরের সমস্ত অপ্রত্যাশিত ত্রুটি ধরে
    console.error("Full Upload Process Error (Base64 method):", error);
    return res.status(500).json({ error: `সার্ভার ত্রুটি: ${error.message}` });
  }
}