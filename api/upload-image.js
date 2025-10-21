/**
 * Vercel Serverless Function for Image Upload
 * API Key থাকবে server-side এ (secure)
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY
    
    if (!IMGBB_API_KEY) {
      console.error('❌ IMGBB_API_KEY not found in environment variables')
      return res.status(500).json({ error: 'Server configuration error' })
    }
    
    // Get form data
    const formData = new FormData()
    
    // Check if image is base64 or file
    if (req.body.image) {
      // Base64 upload
      formData.append('image', req.body.image)
    } else if (req.files && req.files.image) {
      // File upload (if using multipart)
      formData.append('image', req.files.image.data)
    } else {
      return res.status(400).json({ error: 'No image provided' })
    }
    
    console.log('📤 Uploading to ImgBB...')
    
    // Upload to ImgBB
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: 'POST',
        body: formData,
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ ImgBB error:', errorData)
      return res.status(response.status).json({
        error: errorData.error?.message || 'Upload failed'
      })
    }
    
    const data = await response.json()
    
    if (!data.success || !data.data?.url) {
      console.error('❌ Invalid ImgBB response:', data)
      return res.status(500).json({ error: 'Invalid response from ImgBB' })
    }
    
    console.log('✅ Upload successful:', data.data.url)
    
    // Return image URL
    return res.status(200).json({
      success: true,
      url: data.data.url,
      delete_url: data.data.delete_url,
    })
    
  } catch (error) {
    console.error('❌ Server error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}