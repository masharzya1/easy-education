/**
 * Vercel Serverless Function: /api/upload-image
 * এই ফাইলটি ImgBB তে আপলোড করার জন্য API Key গোপন রাখে এবং Base64 ডেটা হ্যান্ডেল করে।
 * ⚠️ নিশ্চিত করুন যে IMGBB_API_KEY ভেরিয়েবলটি Vercel-এ সেট করা আছে।
 */

// ImgBB API Key এনভায়রনমেন্ট ভেরিয়েবল থেকে নেওয়া হলো
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export default async function handler(req, res) {
  // ১. শুধুমাত্র POST অনুরোধ গ্রহণ করা হবে।
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  
  // ২. API Key যাচাইকরণ
  if (!IMGBB_API_KEY) {
    return res.status(500).json({ success: false, error: 'ImgBB API Key is not configured on the server.' });
  }
  
  // ৩. ক্লায়েন্ট থেকে আসা JSON বডি থেকে Base64 string বের করা হলো।
  // যেহেতু ক্লায়েন্ট (src/lib/imgbb.js) JSON.stringify({ image: base64Data }) পাঠাচ্ছে, 
  // তাই এটি req.body.image থেকে অ্যাক্সেস করা যাবে।
  const { image: base64Data } = req.body;
  
  if (!base64Data || typeof base64Data !== 'string') {
    return res.status(400).json({ success: false, error: "Missing or invalid 'image' data (Base64 string expected in JSON body)." });
  }
  
  // ৪. ImgBB-এর জন্য ডেটা ফরম্যাট করা: 
  // ImgBB API-কে অবশ্যই 'application/x-www-form-urlencoded' ফরম্যাটে 'image' প্যারামিটারটি পাঠাতে হবে।
  const body = new URLSearchParams();
  body.append('image', base64Data); // Base64 স্ট্রিং এখানে image প্যারামিটারে যুক্ত হলো।
  
  const url = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
  
  try {
    // ৫. ImgBB API কল
    const imgbbResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    
    const imgbbData = await imgbbResponse.json();
    
    if (!imgbbResponse.ok || !imgbbData.success) {
      // ImgBB এরর হ্যান্ডলিং: ImgBB থেকে আসা এররটি ক্লায়েন্টকে ফেরত পাঠানো হলো।
      console.error('ImgBB Error Response:', imgbbData);
      const errorMessage = imgbbData.error?.message || 'Failed to upload image to ImgBB.';
      return res.status(400).json({ success: false, error: errorMessage });
    }
    
    // ৬. সফল রেসপন্স
    return res.status(200).json({
      success: true,
      url: imgbbData.data.url,
      delete_url: imgbbData.data.delete_url
    });
    
  } catch (error) {
    // ৭. সার্ভার এরর হ্যান্ডলিং (নেটওয়ার্ক বা ফেইলিওর)
    console.error('Server error during ImgBB call:', error);
    return res.status(500).json({ success: false, error: `Internal Server Error: ${error.message}` });
  }
}