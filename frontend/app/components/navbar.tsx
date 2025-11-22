'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from './theme-toggle'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // const navLinks = [
  //   { href: '#', label: 'Features' },
  //   { href: '#', label: 'Pricing' },
  //   { href: '#', label: 'Docs' },
  // ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md glass">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">ID</span>
            </div>
            <span>IntelliDocs</span>
          </Link>

          {/* Desktop Nav */}
          {/* <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-foreground/70 hover:text-foreground smooth-transition">
                {link.label}
              </Link>
            ))}
          </div> */}

          {/* Right side */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex gap-2">
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="block py-2 text-foreground/70 hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-2">
              <Link href="/auth/login" className="block">
                <Button variant="ghost" className="w-full">Login</Button>
              </Link>
              <Link href="/auth/register" className="block">
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
