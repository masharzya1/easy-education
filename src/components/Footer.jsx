import { Link } from "react-router-dom"
import { Send, Youtube, MessageCircle, Mail, Phone } from "lucide-react"

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
              SSC ও HSC পরীক্ষার্থী প্রস্তুতি,সিরিজি,মেডিকেল,ভার্সিটি ও মুক্তি বিশ্ববিদ্যালয়,প্রশ্ন ভাটি পরীক্ষা প্রস্তুতি প্রতিষ্ঠান থেকে প্রতিদিন অনলাইন ব্যাচসহ (নিয়মিত) এসএসসি ও এইচএসসি
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">তথ্য সমূহ</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                আমাদের সম্পর্কে
              </Link>
              <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                প্রাইভেসি পলিসি
              </Link>
              <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                বাতায়নযোগীয় মার্চেন্ট
              </Link>
              <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                বিজ্ঞাপন প্রদান
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">যোগাযোগ</h4>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:support@bondipathshala.com.bd"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                support@bondipathshala.com.bd
              </a>
              <p className="text-muted-foreground text-sm">
                ৭৬ সিরি মোড, ঢাকা ১২১৩
              </p>
              <a
                href="tel:+8801796773301"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                01796773301
              </a>
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
            <div className="flex flex-col gap-2">
              <a
                href="https://t.me/Easy_Education_01"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Telegram
              </a>
              <a
                href="https://youtube.com/@easyeducation19"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Youtube className="w-4 h-4" />
                YouTube 01
              </a>
              <a
                href="https://youtube.com/@easyeducation-01"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
              >
                <Youtube className="w-4 h-4" />
                YouTube 02
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>স্বত্ব © ২০২৫ বন্দী পাঠশালা লিমিটেডএর সর্বস্বত্ব সংরক্ষিত</p>
        </div>
      </div>
    </footer>
  )
}
