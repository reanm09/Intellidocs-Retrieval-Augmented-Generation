import Link from 'next/link'
import { Github, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="text-center md:text-left">
            <h3 className="font-display font-bold text-lg">IntelliDocs</h3>
            <p className="text-foreground/70 text-sm mt-1">
              AI-powered document analysis platform
            </p>
          </div>

          <div className="flex gap-6">
            <Link 
              href="https://github.com/reanm09/" 
              target="_blank" 
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </Link>
            <Link 
              href="https://linkedin.com/in/adithya-krishna06/" 
              target="_blank" 
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-foreground/60">
          <p>&copy; 2025 IntelliDocs. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}