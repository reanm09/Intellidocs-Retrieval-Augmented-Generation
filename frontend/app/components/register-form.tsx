'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { registerUser } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Loader2 } from 'lucide-react'

export default function RegisterForm() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    try {
      setLoading(true)
      const response = await registerUser(
        formData.username,
        formData.email,
        formData.password
      )

      if (response.data.ok) {
        router.push("/dashboard")
      } else {
        setError(response.data.error || "Registration failed")
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Registration failed. Try again."
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">

        {error && (
          <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
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
            placeholder="john_doe"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
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
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="agreeToTerms"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              disabled={loading}
              className="rounded border-border w-4 h-4"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-foreground/70">
              I agree to the terms and conditions
            </label>
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={loading}
        >
          {loading ? (
            <>Creating Account <Loader2 className="h-4 w-4 animate-spin" /></>
          ) : (
            <>Create Account <span className="text-lg">→</span></>
          )}
        </Button>
      </form>

      <div className="border-t border-border pt-4">
        <p className="text-sm text-center text-foreground/70">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  )
}