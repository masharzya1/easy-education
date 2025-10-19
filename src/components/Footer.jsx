import { Link } from "react-router-dom"
import { Facebook, Twitter, Instagram, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              EduStream
            </h3>
            <p className="text-muted-foreground text-sm">
              Stream free courses anytime, anywhere. Learn at your own pace.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Home
              </Link>
              <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Courses
              </Link>
              <Link to="/news" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                News
              </Link>
              <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Community
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                About Us
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Contact
              </Link>
              <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                FAQ
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} EduStream. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
