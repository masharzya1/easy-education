// Vercel/Next.js পরিবেশে ফাইল আপলোডের জন্য এই কনফিগারেশনটি আবশ্যক।
// এটি ডিফল্ট বডি পার্সারকে নিষ্ক্রিয় করে দেয়।
export const config = {
  api: {
    bodyParser: false, // File uploads requires bodyParser to be false
  },
}

// এই ফাংশনটি file upload data কে parse করবে।
// বাস্তব প্রজেক্টে, আপনি 'formidable' বা 'multer'-এর মতো লাইব্রেরি ব্যবহার করবেন।
// এখানে আমরা একটি সরলীকৃত async handler ব্যবহার করছি যা Next.js সার্ভারলেস ফাংশনের জন্য উপযুক্ত।
const parseMultipartForm = async (req) => {
  return new Promise((resolve, reject) => {
    // এখানে আপনার ফাইল পার্সিং লজিক বসবে (যেমন 'formidable' ব্যবহার করে)
    // যেহেতু এই পরিবেশে থার্ড-পার্টি লাইব্রেরি ইনস্টল করা যায় না, আমরা ধরে নিচ্ছি
    // Vercel পরিবেশটি সঠিকভাবে ফাইল ডেটা req-এর সাথে পাঠাবে
    
    // *** গুরুত্বপূর্ণ: Next.js/Vercel এর জন্য সঠিক সলিউশন হলো 'formidable' ব্যবহার করা ***
    
    // যদি আপনি Multer/formidable ব্যবহার করেন, তবে সেটি ফাইলটিকে একটি টেম্পোরারি লোকেশনে সেভ করবে।
    // আমরা আপনার পূর্বের লজিক অনুসরণ করছি যেখানে ফাইলটি req.files.image এ থাকার কথা।
    
    // যেহেতু FormData ক্লায়েন্ট থেকে আসছে, আমরা এখানে একটি সরলীকৃত অনুমান করছি:
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // যদি আপনার সার্ভার সঠিকভাবে ফাইলটি পার্স করে, তবে এখানে তা পাওয়া উচিত।
      // যেহেতু আপনার error হচ্ছে, আমরা ধরে নিচ্ছি req.files undefined.
      // প্রকৃত সলিউশনের জন্য আপনাকে সার্ভার-সাইডে npm install formidable করতে হবে এবং এখানে ব্যবহার করতে হবে।
      
      // এখানে ফাইলটি base64 এ কনভার্ট করে upload করা সবচেয়ে সহজ,
      // কিন্তু আপনি যেহেতু file object পাঠাচ্ছেন, আমরা সেটাই অনুসরণ করছি।
      
      // **সারল্যের জন্য, আমরা ধরে নিচ্ছি যে ফাইলটি সফলভাবে পার্স হয়েছে এবং req.file এ আছে।**
      // যদি req.files এ না থাকে, তবে এই অংশটি ব্যর্থ হবে।
      if (req.files && req.files.image) {
        resolve({ file: req.files.image, isBase64: false });
      } else {
        // যেহেতু আমরা এখানে formidable ইনস্টল করতে পারছি না, 
        // তাই Vercel/Next.js এ কাজ করানোর জন্য এই অংশটি পরিবর্তন করতে হবে।
        // তবে ফাইল স্ট্রাকচার যেহেতু এমন, আমরা আসল লজিকের দিকে নজর দিচ্ছি:
        resolve({ error: "File not properly parsed. Ensure file parsing middleware (like formidable) is used." });
      }
    } else if (req.headers["content-type"]?.includes("application/json")) {
      resolve({ image: req.body.image, isBase64: true });
    } else {
      reject(new Error("Invalid Content Type"));
    }
  });
};


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  
  // এই কী-টি এনভায়রনমেন্ট ভেরিয়েবল হিসেবে Vercel-এ সেট করতে হবে।
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
  
  if (!IMGBB_API_KEY) {
    console.error("[v0] imgbb API key is missing");
    return res.status(500).json({
      error: "Image upload service is not configured. Please contact support. (Missing API Key)",
    })
  }
  
  try {
    // 1. ফাইল ডেটা বের করা
    // এখানে ক্লায়েন্ট-সাইডের মতো একই FormData লজিক ব্যবহার হবে। 
    // যদি আপনি Vercel/Next.js ব্যবহার করেন, তবে এখানে আপনাকে ফাইল পার্সিং লজিক (formidable) ব্যবহার করতে হবে।
    
    const formData = new FormData();
    let uploadData;
    
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // যেহেতু req.files?.image কাজ করছিল না, আমরা ধরে নিচ্ছি ফাইলটিকে পার্স করতে হবে।
      // Vercel এ এটিই মূল সমস্যার কারণ।
      // *** আপনাকে Vercel-এ formidable ব্যবহার করে ফাইলটি পার্স করতে হবে ***
      return res.status(400).json({ error: "File parsing error. Ensure formidable/multer is correctly configured in your Next.js/Vercel API route to read multipart/form-data." });
      
    } else if (req.headers["content-type"]?.includes("application/json")) {
      // Base64 upload
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }
      formData.append("image", image); // Base64 ডেটা হিসেবে পাঠানো
      uploadData = formData;
    } else {
      return res.status(400).json({ error: "Invalid content type" });
    }
    
    // 2. imgbb-তে আপলোড (যদি uploadData তৈরি হয়)
    if (uploadData) {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: uploadData, // FormData (Base64 এর জন্য)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] imgbb error:", errorData)
        return res.status(response.status).json({
          error: errorData.error?.message || "Failed to upload image to imgbb",
        })
      }
      
      const data = await response.json()
      
      if (!data.success || !data.data?.url) {
        return res.status(500).json({ error: "Invalid response from imgbb" })
      }
      
      return res.status(200).json({ url: data.data.url })
    } else {
      return res.status(500).json({ error: "Server failed to process file stream." });
    }
  } catch (error) {
    console.error("[v0] Server error uploading image:", error)
    return res.status(500).json({
      error: "Failed to upload image. Please try again.",
    })
  }
}