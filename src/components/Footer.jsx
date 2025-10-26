import { Link } from "react-router-dom"
import { Send, Youtube, MessageCircle, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Easy Education
            </h3>
            <p className="text-muted-foreground text-sm">
              Get Free or Paid courses Anytime, Anywhere. Learn at your own pace.
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
              <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Community
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:easyeducation556644@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                easyeducation556644@gmail.com
              </a>
              <a
                href="tel:+880969752197"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                +880969752197
              </a>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="flex flex-col gap-2">
              <a
                href="https://t.me/Chatbox67_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Support Bot
              </a>
              <a
                href="https://t.me/eesupport01"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Support ID
              </a>
            </div>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://t.me/Easy_Education_01"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors text-sm"
              >
                <Send className="w-5 h-5" />
                <span>Telegram Channel</span>
              </a>
              <a
                href="https://youtube.com/@easyeducation19"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors text-sm"
              >
                <Youtube className="w-5 h-5" />
                <span>YouTube 01</span>
              </a>
              <a
                href="https://youtube.com/@easyeducation-01"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors text-sm"
              >
                <Youtube className="w-5 h-5" />
                <span>YouTube 02</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>Copyright @2025 Easy Education All rights reserved</p>
        </div>
      </div>
    </footer>
  )
}
