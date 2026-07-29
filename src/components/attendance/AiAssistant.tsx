import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

interface AiAssistantProps {
  employeeId: number | null;
}

export default function AiAssistant({ employeeId }: AiAssistantProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello! I am your AI Attendance Assistant. You can ask me questions about your late check-ins, remaining leave balances, shift schedules, or how to apply for regularization overrides.",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !employeeId) return;

    const userMessage = query.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage, timestamp: new Date() }]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/attendance/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, employeeId }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: result.answer || "I could not resolve an answer for that.",
            timestamp: new Date()
          }
        ]);
      } else {
        toast.error('AI assistant is offline or encountered an error.');
      }
    } catch (err) {
      toast.error('Failed to connect to AI engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border bg-card/60 backdrop-blur-md shadow-md h-[400px] flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#f87941]" />
          AI Attendance Assistant
        </CardTitle>
        <CardDescription className="text-xs">
          Ask questions about your working hours, late checks, schedules, and payroll adjustments.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
        {/* Messages Log area */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-4 min-h-0 text-[11px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/40 text-[#f87941]'
                }`}
              >
                {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div
                className={`p-3 rounded-xl border leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-[#2B2D31] dark:border-slate-800 dark:text-slate-200 rounded-tr-none'
                    : 'bg-orange-50/20 border-orange-100/50 text-slate-800 dark:bg-[#1E1F22] dark:border-orange-950/30 dark:text-slate-200 rounded-tl-none font-medium'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-200 text-[#f87941] flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="p-3 rounded-xl border bg-orange-50/20 border-orange-100/50 flex items-center gap-1.5 dark:bg-[#1E1F22] dark:border-orange-950/30">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#f87941]" />
                <span className="text-slate-400 font-bold">AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="flex gap-2 shrink-0 border-t border-slate-100 dark:border-slate-800 pt-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI: e.g. How many late check-ins do I have this month?"
            className="flex-1 h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 focus-visible:ring-[#f87941]"
            disabled={loading || !employeeId}
            required
          />
          <Button
            type="submit"
            disabled={loading || !query.trim() || !employeeId}
            className="bg-[#f87941] hover:bg-[#e06634] text-white h-9 px-4 font-bold flex items-center gap-1 shrink-0"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
