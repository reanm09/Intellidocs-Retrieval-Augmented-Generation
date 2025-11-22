'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, LogOut, User, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import ThemeToggle from '@/components/theme-toggle'
import { getMe, logoutUser } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then(res => {
      if (res.data.ok) setUser(res.data.user)
    }).finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/auth/login')
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground smooth-transition mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold">Account Settings</h1>
        </div>

        <Card className="p-8 mb-6 border-border bg-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.username}</h2>
              <p className="text-foreground/70">{user?.email}</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-6">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Username</label>
              <Input value={user?.username} disabled className="w-full bg-muted/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
              <Input value={user?.email} disabled className="w-full bg-muted/50" />
            </div>
          </div>
        </Card>

        <Card className="p-8 mb-6 border-border bg-card">
          <h3 className="text-lg font-semibold mb-6">Preferences</h3>
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-foreground/70">Switch between light and dark theme</p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        <div className="flex justify-end">
           <Button variant="destructive" className="gap-2" onClick={handleLogout}>
             <LogOut className="w-4 h-4" /> Sign Out
           </Button>
        </div>
      </div>
    </div>
  )
}