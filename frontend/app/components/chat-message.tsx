'use client'

import { Sparkles, User, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources?: string[]
  }
  onPageClick?: (page: number) => void
}

export default function ChatMessage({ message, onPageClick }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  const isThinking = !isUser && !message.content;

  const processedContent = message.content.replace(
    /[([]?(?:PDF\s+)?(?:Page|p\.)\s*(\d+)[)\]]?/gi, 
    (match, pageNum) => `[Page ${pageNum}](#page=${pageNum})`
  );

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex gap-3 max-w-[85%] lg:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-accent/20 to-accent/10 text-accent border border-accent/20"
        )}>
          {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
        </div>

        <div className="space-y-2 w-full">
          <div
            className={cn(
              'p-4 rounded-2xl text-sm shadow-sm transition-all',
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'bg-card border border-border rounded-tl-none',
              isThinking && "animate-pulse bg-muted/50"
            )}
          >
            {isThinking ? (
               <div className="flex items-center gap-1 h-6 px-2">
                 <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                 <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                 <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce"></span>
               </div>
            ) : (
                <div className="prose dark:prose-invert max-w-none break-words leading-relaxed">
                    <ReactMarkdown 
                        components={{
                            a: ({node, href, children, ...props}) => {
                                if (href?.startsWith('#page=')) {
                                    const page = parseInt(href.split('=')[1]);
                                    return (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (onPageClick) onPageClick(page);
                                            }}
                                            className="inline-flex items-center gap-1 text-accent hover:text-accent/80 hover:underline font-medium bg-accent/10 px-1.5 py-0.5 rounded mx-1 transition-colors cursor-pointer border-none align-baseline"
                                            title={`Jump to page ${page}`}
                                        >
                                            <BookOpen className="w-3 h-3" />
                                            {children}
                                        </button>
                                    );
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" {...props}>{children}</a>;
                            },
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            strong: ({node, ...props}) => <span className="font-semibold text-foreground/90" {...props} />,
                        }}
                    >
                        {isUser ? message.content : processedContent}
                    </ReactMarkdown>
                </div>
            )}
          </div>
          
          {/* Sources */}
          {!isUser && !isThinking && message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-1 animate-in fade-in slide-in-from-top-2 duration-500">
                {message.sources.map((source, idx) => (
                  <span key={idx} className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border/50">
                    {source}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}