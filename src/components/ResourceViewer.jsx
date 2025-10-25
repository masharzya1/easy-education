import { useState } from "react"
import { Download, FileText, Image as ImageIcon, X, ExternalLink } from "lucide-react"

export default function ResourceViewer({ resource }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!resource || !resource.url) return null

  const extractGoogleDriveFileId = (url) => {
    const patterns = [
      /\/file\/d\/([^\/]+)/,
      /id=([^&]+)/,
      /\/d\/([^\/]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const isGoogleDriveLink = (url) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com')
  }

  const getProcessedUrls = (url) => {
    if (isGoogleDriveLink(url)) {
      const fileId = extractGoogleDriveFileId(url)
      if (fileId) {
        return {
          preview: `https://drive.google.com/file/d/${fileId}/preview`,
          download: `https://drive.google.com/uc?export=download&id=${fileId}`,
          isGoogleDrive: true
        }
      }
    }
    return {
      preview: url,
      download: url,
      isGoogleDrive: false
    }
  }

  const getFileType = (url) => {
    const urlLower = url.toLowerCase()
    if (urlLower.includes('.pdf') || urlLower.includes('pdf') || urlLower.includes('drive.google.com')) return 'pdf'
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) return 'image'
    return 'unknown'
  }

  const fileType = getFileType(resource.url)
  const { preview, download, isGoogleDrive } = getProcessedUrls(resource.url)

  const handleDownload = async () => {
    try {
      if (isGoogleDrive) {
        window.open(download, '_blank')
      } else {
        const response = await fetch(resource.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = resource.label || 'download'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download failed:', error)
      window.open(download, '_blank')
    }
  }

  if (fileType === 'unknown') {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all border border-primary/20 hover:border-primary/40 font-medium text-sm group"
      >
        <FileText className="w-4 h-4" />
        {resource.label}
        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
      </a>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all border border-primary/20 hover:border-primary/40 font-medium text-sm group w-full sm:w-auto justify-center sm:justify-start"
      >
        {fileType === 'pdf' ? (
          <FileText className="w-4 h-4" />
        ) : (
          <ImageIcon className="w-4 h-4" />
        )}
        <span>{resource.label}</span>
        {isOpen ? (
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        ) : (
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {isOpen && (
        <div className="bg-card border-2 border-primary/20 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b border-primary/20">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {fileType === 'pdf' ? (
                <FileText className="w-4 h-4 text-primary" />
              ) : (
                <ImageIcon className="w-4 h-4 text-primary" />
              )}
              <span>{resource.label}</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-muted/30">
            {fileType === 'pdf' ? (
              <iframe
                src={preview}
                className="w-full h-[500px] sm:h-[600px]"
                title={resource.label}
              />
            ) : (
              <div className="p-4">
                <img
                  src={preview}
                  alt={resource.label}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
