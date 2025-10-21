// Vercel/Next.js-এর জন্য কোনো অতিরিক্ত 'config' বা 'formidable' প্রয়োজন নেই।

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "শুধুমাত্র POST মেথড অনুমোদিত।" });
  }
  
  // API কী এনভায়রনমেন্ট ভেরিয়েবল থেকে লোড করা হচ্ছে (Vercel-এ সেট করতে হবে)
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
  
  if (!IMGBB_API_KEY) {
    console.error("IMGBB_API_KEY Missing");
    // আপনার Vercel এনভায়রনমেন্ট ভেরিয়েবল সেট করতে ভুলবেন না
    return res.status(500).json({ error: "সার্ভার কনফিগারেশনে ত্রুটি। API Key পাওয়া যায়নি।" });
  }
  
  // 1. ক্লায়েন্ট থেকে আসা JSON বডি থেকে Base64 ইমেজ স্ট্রিং বের করা
  const { image: base64Image } = req.body;
  
  if (!base64Image) {
    return res.status(400).json({ error: "ইমেজের Base64 ডেটা খুঁজে পাওয়া যায়নি।" });
  }
  
  try {
    // 2. ImgBB API-তে আপলোড করা
    // ImgBB API Base64 স্ট্রিং গ্রহণ করে। আমরা এটিকে FormData-তে ভরে POST করছি।
    const formData = new FormData();
    // 'image' ফিল্ডের মান হবে Base64 স্ট্রিং
    formData.append("image", base64Image);
    
    const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });
    
    if (!imgbbResponse.ok) {
      const errorData = await imgbbResponse.json();
      return res.status(imgbbResponse.status).json({
        error: errorData.error?.message || "ImgBB আপলোড করতে ব্যর্থ হয়েছে।",
      });
    }
    
    const data = await imgbbResponse.json();
    
    if (!data.success || !data.data?.url) {
      return res.status(500).json({ error: "ImgBB থেকে অপ্রত্যাশিত সাড়া (response) পাওয়া গেছে।" });
    }
    
    // 3. সফল URL ক্লায়েন্টের কাছে পাঠানো
    return res.status(200).json({ url: data.data.url });
    
  } catch (error) {
    console.error("Full Upload Process Error (Base64 method):", error);
    return res.status(500).json({ error: `সার্ভার ত্রুটি: ${error.message}` });
  }
}