'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setError("");
  
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
  
    try {
      const res = await registerUser(username, email, password);
  
      console.log("REGISTER RESPONSE:", res.data);
  
      if (res.data.ok) {
        router.push("/dashboard");
      } else {
        setError(res.data.error || "Registration failed");
      }
    } catch (err: any) {
      console.log("REGISTER ERROR:", err.response?.data);
      setError("Registration failed");
    }
  };
  

  return (
    <div className="min-h-screen bg-background flex justify-center items-center">
      <form onSubmit={handleRegister} className="p-8 border rounded-xl w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>

        <input placeholder="Username" className="w-full px-4 py-2 border rounded-md"
          value={username} onChange={(e) => setUsername(e.target.value)} />

        <input placeholder="Email" className="w-full px-4 py-2 border rounded-md"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <input type="password" placeholder="Password" className="w-full px-4 py-2 border rounded-md"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        <input type="password" placeholder="Confirm Password" className="w-full px-4 py-2 border rounded-md"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90 transition-all shadow-md hover:shadow-lg">
          Sign Up
        </button>

        <p className="text-center text-sm mt-4">Already registered?
          <Link href="/auth/login" className="text-primary ml-1">Login</Link>
        </p>
      </form>
    </div>
  );
}
