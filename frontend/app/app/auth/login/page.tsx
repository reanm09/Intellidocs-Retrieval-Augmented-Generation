'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
  
    try {
      console.log("Attempting login for:", username);
      const res = await loginUser(username, password);
      console.log("Login response:", res.data);
  
      if (res.data.ok) {

        window.location.href = "/dashboard";
      } else {
        setError(res.data.error || "Invalid credentials");
      }
    } catch (err: any) {
      console.error("Login Error Details:", err);
      const msg = err.response?.data?.error || "Connection failed. Is the backend running?";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center items-center">
      <form onSubmit={handleLogin} className="p-8 border rounded-xl w-full max-w-md space-y-4 bg-card shadow-sm">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div>
            <label className="text-sm font-medium">Username</label>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border rounded-md mt-1"
            />
        </div>

        <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border rounded-md mt-1"
            />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isLoading ? (
             <>Signing in <Loader2 className="w-4 h-4 animate-spin"/></> 
          ) : "Login"}
        </button>

        <p className="text-center text-sm">Don't have an account?
          <Link href="/auth/register" className="text-primary ml-1 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}