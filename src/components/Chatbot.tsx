import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGameRoute } from '@/hooks/useGameRoute';
import { useAfterFilm } from '@/hooks/useAfterFilm';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Chatbot: React.FC = () => {
  const { language, t } = useLanguage();
  const { isInGame } = useGameRoute();
  // On the homepage the assistant waits until the film is over, together with the cookie banner.
  const afterFilm = useAfterFilm();
  const { updateStreak, user, session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [hasTriggeredActivity, setHasTriggeredActivity] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!afterFilm) return;
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [afterFilm]);

  // Detect language from the latest user message
  const detectLanguage = (text: string): 'bg' | 'en' => {
    // Check for Cyrillic characters (Bulgarian)
    const cyrillicPattern = /[\u0400-\u04FF]/;
    return cyrillicPattern.test(text) ? 'bg' : 'en';
  };

  const streamChat = async (userMessages: Message[]) => {
    const lastUserMessage = userMessages.filter(m => m.role === 'user').pop();
    const detectedLanguage = lastUserMessage ? detectLanguage(lastUserMessage.content) : language;
    // Logged-in users send their token (their limit is per account); guests chat without one (per IP address).
    const token = session?.access_token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: userMessages,
        language: detectedLanguage,
      }),
    });

    if (!resp.ok) {
      let serverMessage = detectedLanguage === 'bg'
        ? 'Възникна проблем със сървъра.'
        : 'Server error while starting chat.';

      try {
        const errData = await resp.json();
        if (typeof errData?.error === 'string') {
          serverMessage = errData.error;
        }
      } catch {
        // fallback message above
      }

      throw new Error(serverMessage);
    }

    if (!resp.body) {
      throw new Error(detectedLanguage === 'bg' ? 'Липсва поток отговор.' : 'Missing response stream.');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Trigger activity/streak for AI interaction (only once per session)
    if (user && !hasTriggeredActivity) {
      setHasTriggeredActivity(true);
      updateStreak();
    }

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      const fallback = language === 'bg'
        ? 'Съжалявам, възникна грешка. Моля, опитайте отново.'
        : 'Sorry, an error occurred. Please try again.';

      // fetch() rejects with a TypeError when the request never reaches the server
      // (offline, blocked by the page, or the server is down): say so in plain words.
      const unreachable = error instanceof TypeError;
      const offline = language === 'bg'
        ? 'Няма връзка с AI асистента. Провери интернет връзката си и опитай отново след малко.'
        : 'Could not reach the AI assistant. Check your connection and try again in a moment.';
      const message = unreachable ? offline : error instanceof Error && error.message ? error.message : fallback;
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Hide chatbot during games, and on the homepage until the film is over.
  if (isInGame || !afterFilm) {
    return null;
  }

  return (
    <>
      {/* Chat Window */}
      <div className={cn(
        "fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-[80] w-[320px] sm:w-[360px] max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-48px)] origin-bottom-right transition-surface",
        // Opening decelerates over 300ms; closing is quicker and accelerates away.
        isOpen 
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto duration-300 ease-out" 
          : "opacity-0 translate-y-4 scale-95 pointer-events-none duration-200 ease-in"
      )}>
        <div className="floating-glass overflow-hidden rounded-2xl flex flex-col h-[400px] sm:h-[500px] max-h-[calc(100svh-7rem)]" style={{ visibility: isOpen ? 'visible' : 'hidden' }} aria-hidden={!isOpen}>
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {language === 'bg' ? 'AI Асистент' : 'AI Assistant'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'bg' ? 'Питай за България' : 'Ask about Bulgaria'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon"
              onClick={() => setIsOpen(false)}
              aria-label={language === 'bg' ? 'Затвори чата' : 'Close chat'}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {language === 'bg' 
                    ? 'Здравейте! Мога да ви помогна с информация за този сайт и за България.' 
                    : 'Hello! I can help you with information about this website and about Bulgaria.'}
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex chat-msg-in",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-md px-4 py-2.5 text-sm leading-relaxed break-words",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "glass-panel rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start chat-msg-in">
                <div className="glass-panel rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'bg' ? 'Напишете съобщение...' : 'Type a message...'}
                aria-label={language === 'bg' ? 'Съобщение до AI асистента' : 'Message to the AI assistant'}
                className="glass-input flex-1 min-w-0 px-4 py-2.5 text-sm"
                disabled={isLoading}
              />
              <Button variant="ghost" size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label={language === 'bg' ? 'Изпрати' : 'Send'}
              >
                <Send className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <div className={cn(
        "chat-teaser fixed bottom-[80px] sm:bottom-[100px] right-3 sm:right-6 z-50 transition-surface duration-200 ease-out",
        (showTooltip && !isOpen) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}>
        <div className="floating-glass px-4 py-2 rounded-xl text-sm whitespace-nowrap">
          <p className="font-medium">
            {language === 'bg' ? 'Имаш въпрос?' : 'Have a question?'}
          </p>
          <p className="text-foreground/70">
            {language === 'bg' ? 'Питай AI.' : 'Ask AI.'}
          </p>
        </div>
      </div>

      {/* FAB Button */}
      <Button variant="outline" size="icon"
        aria-label={language === 'bg' ? 'AI Асистент' : 'AI Assistant'}
        style={{ '--float-delay': '80ms' } as React.CSSProperties}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
        className={cn(
          "floating-glass float-in fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-[80] w-12 h-12 sm:w-14 sm:h-14 rounded-full",
          "flex items-center justify-center",
          "transition-interactive duration-200 ease-out hover:scale-105 hover:shadow-xl hover:shadow-primary/40",
          "active:scale-95",
          isOpen && "rotate-0"
        )}
      >
        <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
      </Button>
    </>
  );
};

export default Chatbot;
