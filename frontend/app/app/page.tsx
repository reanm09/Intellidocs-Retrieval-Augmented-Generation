import Link from 'next/link'
import { ArrowRight, Upload, MessageSquare, Zap, CheckCircle2, Github, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

export default function Landing() {
  const features = [
    {
      icon: Upload,
      title: 'Smart Upload',
      description: 'Upload PDFs instantly with drag-and-drop support and automatic processing',
    },
    {
      icon: MessageSquare,
      title: 'Conversational AI',
      description: 'Ask natural questions and get instant, accurate answers from your documents',
    },
    {
      icon: Zap,
      title: 'Powered by RAG',
      description: 'Advanced retrieval-augmented generation for context-aware intelligent responses',
    },
    {
      icon: CheckCircle2,
      title: 'Source Citations',
      description: 'Every answer includes precise document references and snippet highlights',
    },
    {
      icon: MessageSquare,
      title: 'Chat History',
      description: 'Maintain separate conversation threads for each document you upload',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Stream responses in real-time with intelligent streaming for smooth interactions',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Upload',
      description: 'Upload your PDF documents with our intuitive interface',
    },
    {
      number: '02',
      title: 'Ask',
      description: 'Ask questions conversationally about your documents',
    },
    {
      number: '03',
      title: 'Understand',
      description: 'Get AI-powered insights with full source attribution',
    },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex flex-col justify-center items-center text-center px-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
          

          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h1 className="text-5xl font-display font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
                Unlock Document Intelligence
              </h1>
              <p className="mt-6 text-xl text-foreground/70 text-balance max-w-2xl mx-auto">
                Chat with your PDFs using AI. Extract insights, find answers instantly, and experience the future of document analysis.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/auth/register">
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>

            
          </div>
        </section>

        <section className="px-4 py-24 bg-secondary/30">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold">How It Works</h2>
              <p className="mt-4 text-lg text-foreground/70">Three simple steps to unlock your document insights</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step) => (
                <div key={step.number} className="relative">
                  <div className="text-5xl font-display font-bold text-accent/20 mb-4">{step.number}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-foreground/70">{step.description}</p>
                  {/* Connecting line */}
                  {steps.indexOf(step) < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold">Powerful Features</h2>
              <p className="mt-4 text-lg text-foreground/70">Everything you need for intelligent document analysis</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="group p-8 rounded-lg border border-border bg-card hover:border-accent/50 hover:bg-accent/5 smooth-transition">
                    <Icon className="w-8 h-8 text-accent mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-foreground/70">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
