import React, { useState, useRef, memo, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Message } from '../types';
import { Bot, Copy, Check, Bookmark, Clock } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isBookmarked?: boolean;
  onToggleBookmark?: (message: Message) => void;
}

// Defined outside component to prevent re-creation on every render
// Using 'any' for props to satisfy ReactMarkdown's complex type requirements regarding optional children and extra props
const ScriptureBlockquote = (props: any) => {
  const { children } = props;
  const [copied, setCopied] = useState(false);
  const quoteRef = useRef<HTMLQuoteElement>(null);

  const handleCopy = () => {
    if (quoteRef.current) {
      const text = quoteRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-3 md:my-4 not-prose">
      <blockquote 
        ref={quoteRef}
        className="border-l-4 border-amber-500 bg-amber-50 px-4 py-2 md:px-5 md:py-3 rounded-r-lg relative"
      >
        <div className="font-serif italic text-base md:text-lg leading-relaxed text-stone-800">
          {children}
        </div>
      </blockquote>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-white hover:bg-stone-50 rounded-md text-stone-400 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm border border-stone-200 z-10"
        title="Copy scripture"
        aria-label="Copy scripture"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({ message, isBookmarked, onToggleBookmark }) => {
  const isUser = message.role === 'user';
  const isPending = message.status === 'pending';
  const [copied, setCopied] = useState(false);

  // Memoize the components object to prevent unnecessary re-renders of ReactMarkdown
  // Cast to partial Components to satisfy TS strict checks if necessary, though 'any' in component handles it
  const markdownComponents: Partial<Components> = useMemo(() => ({
    blockquote: isUser ? undefined : ScriptureBlockquote
  }), [isUser]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-4 md:mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 md:gap-3`}>
        
        {/* Avatar - Bot Only */}
        {!isUser && (
          <div className="flex-shrink-0 mb-1 hidden sm:block">
            <div className="w-8 h-8 rounded-full flex items-center justify-center border shadow-sm bg-amber-700 border-amber-800 text-white">
              <Bot className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Message Content Bubble */}
        <div 
          className={`relative px-4 py-3 md:px-6 md:py-5 shadow-sm overflow-hidden group transition-all duration-200
            ${isUser 
              ? 'bg-stone-800 text-stone-50 rounded-2xl rounded-br-sm' 
              : 'bg-white border border-stone-200 text-stone-800 rounded-2xl rounded-bl-sm'
            }
            ${isPending ? 'opacity-80 border-2 border-dashed border-stone-400/30 bg-stone-700' : ''}
          `}
        >
          {/* Header / Actions (Bot Only mostly, but available for both implicitly via hover) */}
          <div className="flex justify-between items-center mb-1">
            {/* Bot Name Label */}
            {!isUser ? (
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                Biblia AI
              </div>
            ) : <div />}

            {/* Action Buttons - Hide if pending */}
            {!message.isStreaming && !isPending && (
              <div className={`flex items-center gap-1 ${isUser ? 'text-stone-400' : 'text-stone-400'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                <button 
                  onClick={handleCopyMessage}
                  className="p-1 hover:text-amber-500 transition-colors"
                  title="Copy message"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                
                {onToggleBookmark && (
                  <button 
                    onClick={() => onToggleBookmark(message)}
                    className={`p-1 transition-colors ${isBookmarked ? 'text-amber-500' : 'hover:text-amber-500'}`}
                    title={isBookmarked ? "Remove bookmark" : "Bookmark this message"}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={`
            prose max-w-none leading-relaxed break-words
            ${isUser 
              ? 'prose-invert font-sans text-base prose-p:my-1 prose-p:leading-relaxed' 
              : 'font-serif prose-stone prose-base md:prose-lg prose-strong:text-amber-800 prose-a:text-amber-700'}
          `}>
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Timestamp & Status */}
          <div className={`text-[10px] mt-2 font-medium opacity-60 text-right flex items-center justify-end gap-1 ${isUser ? 'text-stone-300' : 'text-stone-400'}`}>
             {isPending && <Clock className="w-3 h-3 animate-pulse" />}
             {isPending ? 'Waiting for connection...' : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export memoized component to prevent re-rendering of unchanged messages in the list
export const MessageBubble = memo(MessageBubbleComponent);