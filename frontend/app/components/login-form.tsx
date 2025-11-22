'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!formData.username || !formData.password) {
        setError('Please fill in all fields')
        setIsLoading(false)
        return
      }

      const res = await loginUser(formData.username, formData.password)

      if (res.data.ok) {
        router.push("/dashboard")
      } else {
        setError(res.data.error || 'Invalid credentials.')
      }
      
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-8 space-y-6 bg-card border-border">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg smooth-transition">
            <span className="text-destructive text-lg leading-none">⚠</span>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            Username
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-border w-4 h-4"
              disabled={isLoading}
            />
            <span className="text-sm">Remember me</span>
          </label>
          <Link href="#" className="text-sm text-primary hover:text-primary/80 smooth-transition">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full gap-2" disabled={isLoading}>
          {isLoading ? (
            <>Signing in <Loader2 className="h-4 w-4 animate-spin" /></>
          ) : (
            <>Sign In <span className="text-lg">→</span></>
          )}
        </Button>
      </form>

      <div className="border-t border-border pt-4">
        <p className="text-sm text-center text-foreground/70">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium smooth-transition">
            Create one
          </Link>
        </p>
      </div>
    </Card>
  )
}